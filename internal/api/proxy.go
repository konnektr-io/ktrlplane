package api

import (
	"fmt"
	"ktrlplane/internal/service"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// ProxyService handles proxying requests to Loki and Mimir with RBAC and multi-tenancy
type ProxyService struct {
	rbacService *service.RBACService
	lokiURL     *url.URL
	mimirURL    *url.URL
}

// NewProxyService creates a new ProxyService with the specified backend URLs
func NewProxyService(rbacService *service.RBACService, lokiURL, mimirURL *url.URL) *ProxyService {
	return &ProxyService{
		rbacService: rbacService,
		lokiURL:     lokiURL,
		mimirURL:    mimirURL,
	}
}

// LogsProxy returns an http.Handler that proxies Loki log requests with RBAC and multi-tenancy
func (ps *ProxyService) LogsProxy() http.Handler {
	if ps.lokiURL == nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Loki backend not configured", http.StatusServiceUnavailable)
		})
	}

	proxy := httputil.NewSingleHostReverseProxy(ps.lokiURL)

	proxy.Director = func(req *http.Request) {
		ctx := req.Context()

		// 1. Extract userID from context (set by auth middleware)
		userID, ok := ctx.Value("userID").(string)
		if !ok || userID == "" {
			log.Printf("[LogsProxy] No userID found in context")
			req.URL = nil // Prevent proxying
			return
		}

		// 2. Extract projectID and resourceID from URL path: /api/v1/projects/{projectId}/resources/{resourceId}/logs
		parts := strings.Split(req.URL.Path, "/")
		var projectID, resourceID string
		for i, part := range parts {
			if part == "projects" && i+1 < len(parts) {
				projectID = parts[i+1]
			}
			if part == "resources" && i+1 < len(parts) {
				resourceID = parts[i+1]
				break
			}
		}
		if projectID == "" || resourceID == "" {
			log.Printf("[LogsProxy] Missing projectID or resourceID in path: %s", req.URL.Path)
			req.URL = nil
			return
		}

		// 3. RBAC check - user needs read permission on the project (resources inherit from project)
		canAccess, err := ps.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
		if err != nil {
			log.Printf("[LogsProxy] RBAC check failed for user %s, project %s: %v", userID, projectID, err)
			req.URL = nil
			return
		}
		if !canAccess {
			log.Printf("[LogsProxy] User %s does not have read access to project %s", userID, projectID)
			req.URL = nil
			return
		}

		// 4. Use projectID as tenant ID for multi-tenancy scoping
		tenantID := projectID

		// 5. Set up the proxy request to Loki
		req.URL.Scheme = ps.lokiURL.Scheme
		req.URL.Host = ps.lokiURL.Host
		req.URL.Path = "/loki/api/v1/query_range" // Loki's log query endpoint

		// 6. Inject X-Scope-OrgID header for multi-tenancy (using project ID)
		req.Header.Set("X-Scope-OrgID", tenantID)

		// 7. Rewrite LogQL query to inject resource-specific filters
		query := req.URL.Query()
		if logQL := query.Get("query"); logQL != "" {
			// Inject resource label filter: {resource_id="resourceID"} |
			filteredQuery := fmt.Sprintf(`{resource_id="%s"} | %s`, resourceID, logQL)
			query.Set("query", filteredQuery)
			req.URL.RawQuery = query.Encode()
		}

		log.Printf("[LogsProxy] Proxying logs request for user %s, resource %s, project %s", userID, resourceID, tenantID)
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("[LogsProxy] Proxy error: %v", err)
		http.Error(w, "Failed to proxy logs request", http.StatusBadGateway)
	}

	return proxy
}

// MetricsProxy returns an http.Handler that proxies Mimir metrics requests with RBAC and multi-tenancy
func (ps *ProxyService) MetricsProxy() http.Handler {
	if ps.mimirURL == nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Mimir backend not configured", http.StatusServiceUnavailable)
		})
	}

	proxy := httputil.NewSingleHostReverseProxy(ps.mimirURL)

	proxy.Director = func(req *http.Request) {
		ctx := req.Context()

		// 1. Extract userID from context (set by auth middleware)
		userID, ok := ctx.Value("userID").(string)
		if !ok || userID == "" {
			log.Printf("[MetricsProxy] No userID found in context")
			req.URL = nil // Prevent proxying
			return
		}

		// 2. Extract projectID and resourceID from URL path: /api/v1/projects/{projectId}/resources/{resourceId}/metrics/query_range
		parts := strings.Split(req.URL.Path, "/")
		var projectID, resourceID string
		for i, part := range parts {
			if part == "projects" && i+1 < len(parts) {
				projectID = parts[i+1]
			}
			if part == "resources" && i+1 < len(parts) {
				resourceID = parts[i+1]
				break
			}
		}
		if projectID == "" || resourceID == "" {
			log.Printf("[MetricsProxy] Missing projectID or resourceID in path: %s", req.URL.Path)
			req.URL = nil
			return
		}

		// 3. RBAC check - user needs read permission on the project (resources inherit from project)
		canAccess, err := ps.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
		if err != nil {
			log.Printf("[MetricsProxy] RBAC check failed for user %s, project %s: %v", userID, projectID, err)
			req.URL = nil
			return
		}
		if !canAccess {
			log.Printf("[MetricsProxy] User %s does not have read access to project %s", userID, projectID)
			req.URL = nil
			return
		}

		// 4. Use projectID as tenant ID for multi-tenancy scoping
		tenantID := projectID

		// 5. Set up the proxy request to Mimir
		req.URL.Scheme = ps.mimirURL.Scheme
		req.URL.Host = ps.mimirURL.Host
		req.URL.Path = "/prometheus/api/v1/query_range" // Mimir's Prometheus-compatible endpoint

		// 6. Inject X-Scope-OrgID header for multi-tenancy (using project ID)
		req.Header.Set("X-Scope-OrgID", tenantID)

		// 7. Optionally rewrite PromQL query to inject resource-specific filters
		query := req.URL.Query()
		if promQL := query.Get("query"); promQL != "" {
			// Inject resource label filter: {resource_id="resourceID"}
			filteredQuery := fmt.Sprintf(`{resource_id="%s"} and (%s)`, resourceID, promQL)
			query.Set("query", filteredQuery)
			req.URL.RawQuery = query.Encode()
		}

		log.Printf("[MetricsProxy] Proxying metrics request for user %s, resource %s, project %s", userID, resourceID, tenantID)
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("[MetricsProxy] Proxy error: %v", err)
		http.Error(w, "Failed to proxy metrics request", http.StatusBadGateway)
	}

	return proxy
}
