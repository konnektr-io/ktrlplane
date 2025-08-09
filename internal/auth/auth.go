package auth

import (
	"context"
	"fmt"
	"ktrlplane/internal/models"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/gin-gonic/gin"
)

// CustomClaims contains custom data we want to get from the token.
type CustomClaims struct {
	Scope string `json:"scope"`
}

// Validate does nothing for this example, but we need
// it to satisfy validator.CustomClaims interface.
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

// Placeholder for Auth0 configuration needed by middleware
var (
	jwtValidator *validator.Validator
	apiAudience  string
	auth0Domain  string
)

func SetupAuth(audience, domain string) error {
	apiAudience = audience
	auth0Domain = domain
	
	issuerURL, err := url.Parse("https://" + domain + "/")
	if err != nil {
		return fmt.Errorf("failed to parse the issuer url: %w", err)
	}

	provider := jwks.NewCachingProvider(issuerURL, 5*time.Minute)

	jwtValidator, err = validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuerURL.String(),
		[]string{audience},
		validator.WithCustomClaims(
			func() validator.CustomClaims {
				return &CustomClaims{}
			},
		),
		validator.WithAllowedClockSkew(time.Minute),
	)
	if err != nil {
		return fmt.Errorf("failed to set up the jwt validator: %w", err)
	}

	log.Printf("Auth0 JWT validation configured for domain: %s, audience: %s", domain, audience)
	return nil
}

// AuthMiddleware validates the JWT token.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Validate the token
		token, err := jwtValidator.ValidateToken(c.Request.Context(), tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "details": err.Error()})
			c.Abort()
			return
		}

		// Extract claims
		claims := token.(*validator.ValidatedClaims)
		
		// Create user from token claims
		user := models.User{
			ID:    claims.RegisteredClaims.Subject,
			Email: extractEmailFromClaims(claims),
		}

		// Store user in context
		c.Set("user", user)
		c.Next()
	}
}

// extractEmailFromClaims extracts email from JWT claims
func extractEmailFromClaims(claims *validator.ValidatedClaims) string {
	// Try to get email from subject if it looks like an email
	if claims.RegisteredClaims.Subject != "" && strings.Contains(claims.RegisteredClaims.Subject, "@") {
		return claims.RegisteredClaims.Subject
	}
	
	// Try to get email from custom claims (Auth0 typically puts it here)
	if claims.CustomClaims != nil {
		if customClaims, ok := claims.CustomClaims.(*CustomClaims); ok {
			// You might need to adjust this based on how Auth0 structures your claims
			_ = customClaims // placeholder for now
		}
	}
	
	return "" // Return empty if email not found
}

// RBACMiddleware checks if the user in context has the required role for the project. Placeholder.
func RBACMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "User context not found"})
			return
		}
		currentUser := user.(models.User) // Type assertion

		projectID := c.Param("projectId") // Assuming project ID is in the URL path
		if projectID == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Project ID missing in request path"})
			return
		}

		// ---=== Placeholder: Replace with actual RBAC check ===---
		// hasPermission, err := checkPermissionInDB(c.Request.Context(), currentUser.ID, projectID, requiredRole)
		// if err != nil {
		//      c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
		//      return
		// }
		// if !hasPermission {
		//      c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		//      return
		// }
		hasPermission := true // Mock permission
		// ---===================================================---

		if !hasPermission {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions (mock)"})
			return
		}

		fmt.Printf("Mock RBAC check successful for user %s, project %s, role %s\n", currentUser.ID, projectID, requiredRole)
		c.Next()
	}
}

// Helper to extract token from Authorization header
func extractToken(r *http.Request) string {
	bearerToken := r.Header.Get("Authorization")
	if parts := strings.Split(bearerToken, " "); len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
		return parts[1]
	}
	return ""
}

// --- Placeholder for actual DB check ---
// func checkPermissionInDB(ctx context.Context, userID, projectID, requiredRole string) (bool, error) {
//     // Use db.QueryCypher with db.CheckProjectPermissionQuery
//     // Process the result (e.g., count > 0)
//     fmt.Printf("Placeholder: Checking DB permission for user %s, project %s, role %s\n", userID, projectID, requiredRole)
//     return true, nil // Mock response
// }
