package api

import (
	"fmt"
	"ktrlplane/internal/models"
	"ktrlplane/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles all API requests for the control plane.
type Handler struct {
	ProjectService      *service.ProjectService
	ResourceService     *service.ResourceService
	OrganizationService *service.OrganizationService
	RBACService         *service.RBACService
	BillingService      *service.BillingService
	SecretService       *service.SecretService
	ProxyService        *ProxyService // For logs and metrics proxying
}

// NewHandler creates a new Handler with the provided services.
func NewHandler(ps *service.ProjectService, rs *service.ResourceService, os *service.OrganizationService, rbac *service.RBACService, bs *service.BillingService, ss *service.SecretService, proxySvc *ProxyService) *Handler {
	return &Handler{
		ProjectService:      ps,
		ResourceService:     rs,
		OrganizationService: os,
		RBACService:         rbac,
		BillingService:      bs,
		SecretService:       ss,
		ProxyService:        proxySvc,
	}
}

// Helper function to extract user from context
func (h *Handler) getUserFromContext(c *gin.Context) (*models.User, error) {
	userValue, exists := c.Get("user")
	if !exists {
		err := fmt.Errorf("user not found in context")
		if err2 := c.Error(err); err2 != nil {
			return nil, fmt.Errorf("error handling context error: %w", err2)
		}
		return nil, err
	}
	user, ok := userValue.(models.User)
	if !ok {
		err := fmt.Errorf("invalid user type in context")
		if err2 := c.Error(err); err2 != nil {
			return nil, fmt.Errorf("error handling context error: %w", err2)
		}
		return nil, err
	}
	return &user, nil
}

// --- Organization Handlers ---
// GetBillingStatus returns billing status for organization or project (for onboarding/payment enforcement)
func (h *Handler) GetBillingStatus(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string
	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check read permission (billing info is readable by anyone with read access to the scope)
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "read", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to view billing"})
		return
	}

	billingInfo, err := h.BillingService.GetBillingInfo(scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get billing info", "details": err.Error()})
		return
	}

	// Return only status-relevant fields for onboarding
	resp := gin.H{
		"has_payment_method":   len(billingInfo.PaymentMethods) > 0,
		"payment_methods":      billingInfo.PaymentMethods,
		"subscription_details": billingInfo.SubscriptionDetails,
		"stripe_customer":      billingInfo.StripeCustomer, // Stripe customer info (includes email)
	}
	c.JSON(http.StatusOK, resp)
}

// CreateStripeSetupIntent creates a Stripe SetupIntent for payment onboarding
func (h *Handler) CreateStripeSetupIntent(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string
	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	clientSecret, err := h.BillingService.CreateStripeSetupIntent(scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create SetupIntent", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"client_secret": clientSecret})
}

// CreateOrganization handles the creation of a new organization.
func (h *Handler) CreateOrganization(c *gin.Context) {
	var req models.CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.CreateOrganization(c.Request.Context(), req, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, org)
}

// ListOrganizations returns a list of organizations for the current user.
func (h *Handler) ListOrganizations(c *gin.Context) {
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	orgs, err := h.OrganizationService.ListOrganizations(c.Request.Context(), user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list organizations", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orgs)
}

// GetOrganization retrieves an organization by ID for the current user.
func (h *Handler) GetOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.GetOrganization(c.Request.Context(), orgID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, org)
}

// UpdateOrganization updates an organization's details.
func (h *Handler) UpdateOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	var req models.UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.UpdateOrganization(c.Request.Context(), orgID, req.Name, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, org)
}

// DeleteOrganization deletes an organization by ID.
func (h *Handler) DeleteOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = h.OrganizationService.DeleteOrganization(c.Request.Context(), orgID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// --- Project Handlers ---

// CreateProject handles the creation of a new project.
func (h *Handler) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.CreateProject(c.Request.Context(), req, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, project)
}

// GetProject retrieves a project by ID for the current user.
func (h *Handler) GetProject(c *gin.Context) {
	projectID := c.Param("projectId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.GetProjectByID(c.Request.Context(), projectID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

// ListProjects returns a list of projects for the current user.
func (h *Handler) ListProjects(c *gin.Context) {
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	projects, err := h.ProjectService.ListProjects(c.Request.Context(), user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list projects", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, projects)
}

// UpdateProject updates a project's details.
func (h *Handler) UpdateProject(c *gin.Context) {
	projectID := c.Param("projectId")
	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.UpdateProject(c.Request.Context(), projectID, req, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project by ID.
func (h *Handler) DeleteProject(c *gin.Context) {
	projectID := c.Param("projectId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = h.ProjectService.DeleteProject(c.Request.Context(), projectID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Project deletion initiated"})
}

// --- Resource Handlers ---

// CreateResource handles the creation of a new resource in a project.
func (h *Handler) CreateResource(c *gin.Context) {
	projectID := c.Param("projectId")
	var req models.CreateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.CreateResource(c.Request.Context(), projectID, req, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to create resource" {
			_ = c.Error(err)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create resource"})
			return
		}
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resource)
}

// GetResource retrieves a resource by ID for the current user.
func (h *Handler) GetResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.GetResourceByID(c.Request.Context(), projectID, resourceID, user.ID)
	if err != nil {
		// Always return 404 for security - don't reveal if resource exists but user lacks access
		_ = c.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
		return
	}
	c.JSON(http.StatusOK, resource)
}

// ListResources returns a list of resources for a project.
func (h *Handler) ListResources(c *gin.Context) {
	projectID := c.Param("projectId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resources, err := h.ResourceService.ListResources(c.Request.Context(), projectID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list resources", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resources)
}

// UpdateResource updates a resource's details.
func (h *Handler) UpdateResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	var req models.UpdateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.UpdateResource(c.Request.Context(), projectID, resourceID, req, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to update resource" {
			_ = c.Error(err)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to update resource"})
			return
		}
		if err.Error() == "billing account with active subscription required for tier changes" {
			_ = c.Error(err)
			c.JSON(http.StatusPaymentRequired, gin.H{"error": "Billing account with active subscription required for tier changes", "details": err.Error()})
			return
		}
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resource)
}

// DeleteResource deletes a resource by ID.
func (h *Handler) DeleteResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	err = h.ResourceService.DeleteResource(c.Request.Context(), projectID, resourceID, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to delete resource" {
			_ = c.Error(err)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete resource"})
			return
		}
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Resource deletion initiated"})
}

// ListAllResources returns all resources the user has access to across all projects
// with optional filtering by resource_type query parameter
func (h *Handler) ListAllResources(c *gin.Context) {
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Get optional resource_type filter from query params
	resourceType := c.Query("resource_type")

	resources, err := h.ResourceService.ListAllUserResources(c.Request.Context(), user.ID, resourceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"resources": resources})
}

// GetResourceTierPrice returns Stripe price details for a resource type and SKU
func (h *Handler) GetResourceTierPrice(c *gin.Context) {
	resourceType := c.Query("type")
	sku := c.Query("sku")
	if resourceType == "" || sku == "" {
		c.JSON(400, gin.H{"error": "Missing type or sku parameter"})
		return
	}

	resourceTierPrice, err := h.BillingService.GetResourceTierPrice(resourceType, sku)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, resourceTierPrice)
}

// --- RBAC Handlers ---

// ListRoles returns all available roles in the system.
func (h *Handler) ListRoles(c *gin.Context) {
	roles, err := h.RBACService.ListRoles(c.Request.Context())
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list roles"})
		return
	}
	c.JSON(http.StatusOK, roles)
}

// ListRolePermissions returns all permissions for a specific role
func (h *Handler) ListRolePermissions(c *gin.Context) {
	roleID := c.Param("roleId")
	permissions, err := h.RBACService.ListPermissionsForRole(c.Request.Context(), roleID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list permissions for role"})
		return
	}
	c.JSON(http.StatusOK, permissions)
}

// SearchUsers searches for users by query string.
func (h *Handler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" || len(query) < 5 {
		c.JSON(http.StatusOK, []models.User{})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), query)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// --- Project RBAC Handlers ---

// ListProjectRoleAssignments lists all role assignments for a project.
func (h *Handler) ListProjectRoleAssignments(c *gin.Context) {
	projectID := c.Param("projectId")

	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "project", projectID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateProjectRoleAssignment assigns a role to a user for a project.
func (h *Handler) CreateProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")

	var req struct {
		UserID string `json:"user_id" binding:"required"`
		RoleID string `json:"role_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Validate user exists and is unique
	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleID, "project", projectID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Role assignment created",
		"project_id":  projectID,
		"user_id":     req.UserID,
		"role_id":     req.RoleID,
		"assigned_by": user.ID,
	})
}

// DeleteProjectRoleAssignment deletes a role assignment from a project.
func (h *Handler) DeleteProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "project", projectID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		_ = c.Error(err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role assignment", "details": err.Error()})
		return
	}

	// For now, just return success
	c.JSON(http.StatusOK, gin.H{
		"message":       "Role assignment deleted",
		"project_id":    projectID,
		"assignment_id": assignmentID,
	})
}

// --- Resource RBAC Handlers ---

// ListResourceRoleAssignments lists all role assignments for a resource.
func (h *Handler) ListResourceRoleAssignments(c *gin.Context) {
	_ = c.Param("projectId") // TODO: use projectID for additional validation
	resourceID := c.Param("resourceId")

	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "resource", resourceID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateResourceRoleAssignment assigns a role to a user for a resource.
func (h *Handler) CreateResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	var req struct {
		UserID string `json:"user_id" binding:"required"`
		RoleID string `json:"role_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleID, "resource", resourceID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Role assignment created",
		"project_id":  projectID,
		"resource_id": resourceID,
		"user_id":     req.UserID,
		"role_id":     req.RoleID,
		"assigned_by": user.ID,
	})
}

// DeleteResourceRoleAssignment deletes a role assignment from a resource.
func (h *Handler) DeleteResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "resource", resourceID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role assignment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Role assignment deleted",
		"project_id":    projectID,
		"resource_id":   resourceID,
		"assignment_id": assignmentID,
	})
}

// --- Organization RBAC Handlers ---

// ListOrganizationRoleAssignments lists all role assignments for an organization.
func (h *Handler) ListOrganizationRoleAssignments(c *gin.Context) {
	orgID := c.Param("orgId")

	assignments, err := h.RBACService.GetRoleAssignmentsForScope(c.Request.Context(), "organization", orgID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateOrganizationRoleAssignment assigns a role to a user for an organization.
func (h *Handler) CreateOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")

	var req struct {
		UserID string `json:"user_id" binding:"required"`
		RoleID string `json:"role_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		_ = c.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleID, "organization", orgID, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "Role assignment created",
		"organization_id": orgID,
		"user_id":         req.UserID,
		"role_id":         req.RoleID,
		"assigned_by":     user.ID,
	})
}

// DeleteOrganizationRoleAssignment deletes a role assignment from an organization.
func (h *Handler) DeleteOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "organization", orgID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role assignment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Role assignment deleted",
		"organization_id": orgID,
		"assignment_id":   assignmentID,
	})
}

// --- Billing Handlers ---

// GetBillingInfo retrieves billing information for organization or project.
func (h *Handler) GetBillingInfo(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string

	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		_ = c.Error(err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to view billing information"})
		return
	}

	billingInfo, err := h.BillingService.GetBillingInfo(scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get billing information", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, billingInfo)
}

// CreateStripeCustomer creates a Stripe customer for organization or project.
func (h *Handler) CreateStripeCustomer(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string

	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	var req models.CreateStripeCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	// Use user email and name from Auth0 token
	account, err := h.BillingService.CreateStripeCustomer(scopeType, scopeID, user.Email, user.Name, req.Description)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Stripe customer", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// CreateStripeSubscription creates a Stripe subscription for organization or project.
func (h *Handler) CreateStripeSubscription(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string

	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	var req models.CreateStripeSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Request parsed successfully: %+v\n", req)

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	fmt.Printf("About to call billing service CreateStripeSubscription\n")
	account, err := h.BillingService.CreateStripeSubscription(scopeType, scopeID, req)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// CreateStripeCustomerPortal creates a Stripe customer portal session for organization or project.
func (h *Handler) CreateStripeCustomerPortal(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string

	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	// Get return URL from request
	type PortalRequest struct {
		ReturnURL string `json:"return_url" binding:"required"`
	}

	var req PortalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	portalURL, err := h.BillingService.CreateStripeCustomerPortal(scopeType, scopeID, req.ReturnURL)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer portal", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"portal_url": portalURL})
}

// CancelSubscription cancels a Stripe subscription for organization or project.
func (h *Handler) CancelSubscription(c *gin.Context) {
	// Determine scope type and ID from URL
	var scopeType, scopeID string

	if orgID := c.Param("orgId"); orgID != "" {
		scopeType = "organization"
		scopeID = orgID
	} else if projectID := c.Param("projectId"); projectID != "" {
		scopeType = "project"
		scopeID = projectID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	account, err := h.BillingService.CancelSubscription(scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel subscription", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ListPermissionsHandler returns all permissions (actions) for a given scope.
// Regular users can only check their own permissions.
// Service accounts (M2M) with the "check_permissions_on_behalf_of" permission
// can check permissions for any user by providing a userId query parameter.
func (h *Handler) ListPermissionsHandler(c *gin.Context) {
	scopeType := c.Query("scopeType")
	scopeID := c.Query("scopeId")
	if scopeType == "" || scopeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing scopeType or scopeId"})
		return
	}

	caller, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	// Determine whose permissions to check
	targetUserID := caller.ID // Default to caller's own permissions
	requestedUserID := c.Query("userId")

	// If userId parameter is provided, verify authorization
	if requestedUserID != "" {
		// Check if requesting permissions for a different user
		if requestedUserID != caller.ID {
			// Only service accounts can check permissions on behalf of others
			if !caller.IsServiceAccount {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Only service accounts can check permissions on behalf of other users",
				})
				return
			}

			// Verify the service account has the special permission
			canCheck, err := h.RBACService.CanServiceAccountCheckPermissions(c.Request.Context(), caller.ID)
			if err != nil {
				_ = c.Error(err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to verify service account permissions",
					"details": err.Error(),
				})
				return
			}

			if !canCheck {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Service account does not have permission to check permissions on behalf of users",
					"hint":  "The service account needs a role with 'check_permissions_on_behalf_of' permission at global scope",
				})
				return
			}

			// Authorization passed, check permissions for the requested user
			targetUserID = requestedUserID
		}
	}

	permissions, err := h.RBACService.ListPermissions(c.Request.Context(), targetUserID, scopeType, scopeID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list permissions", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":     targetUserID,
		"scope_type":  scopeType,
		"scope_id":    scopeID,
		"permissions": permissions,
	})
}

// --- Logging & Metrics Proxy Handlers ---

// LogsProxyHandler proxies log requests to Loki with RBAC and multi-tenancy
func (h *Handler) LogsProxyHandler(c *gin.Context) {
	if h.ProxyService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Proxy service not available"})
		return
	}

	// Convert Gin context to standard http.ResponseWriter and http.Request for proxy
	h.ProxyService.LogsProxy().ServeHTTP(c.Writer, c.Request)
}

// MetricsProxyHandler proxies metrics requests to Mimir with RBAC and multi-tenancy
func (h *Handler) MetricsProxyHandler(c *gin.Context) {
	if h.ProxyService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Proxy service not available"})
		return
	}

	// Convert Gin context to standard http.ResponseWriter and http.Request for proxy
	h.ProxyService.MetricsProxy().ServeHTTP(c.Writer, c.Request)
}

// --- Secret Management Handlers ---

// GetProjectSecret retrieves a specific secret from a project's namespace.
// Returns base64-encoded secret values that should be decoded in the frontend.
// GET /api/v1/projects/:projectId/secrets/:secretName
func (h *Handler) GetProjectSecret(c *gin.Context) {
	projectID := c.Param("projectId")
	secretName := c.Param("secretName")

	user, err := h.getUserFromContext(c)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if h.SecretService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Secret service not available"})
		return
	}

	secretData, err := h.SecretService.GetProjectSecret(c.Request.Context(), projectID, secretName, user.ID)
	if err != nil {
		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve secret", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, secretData)
}
