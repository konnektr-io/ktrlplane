package api

import (
	"fmt"
	"ktrlplane/internal/models"
	"ktrlplane/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIHandler handles all API requests for the control plane.
type APIHandler struct {
	ProjectService      *service.ProjectService
	ResourceService     *service.ResourceService
	OrganizationService *service.OrganizationService
	RBACService         *service.RBACService
	BillingService      *service.BillingService
}

// NewAPIHandler creates a new APIHandler with the provided services.
func NewAPIHandler(ps *service.ProjectService, rs *service.ResourceService, os *service.OrganizationService, rbac *service.RBACService, bs *service.BillingService) *APIHandler {
	return &APIHandler{
		ProjectService:      ps,
		ResourceService:     rs,
		OrganizationService: os,
		RBACService:         rbac,
		BillingService:      bs,
	}
}

// Helper function to extract user from context
func (h *APIHandler) getUserFromContext(c *gin.Context) (*models.User, error) {
	userValue, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("user not found in context")
	}
	user, ok := userValue.(models.User)
	if !ok {
		return nil, fmt.Errorf("invalid user type in context")
	}
	return &user, nil
}

// --- Organization Handlers ---

// CreateOrganization handles the creation of a new organization.
func (h *APIHandler) CreateOrganization(c *gin.Context) {
	var req models.CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.CreateOrganization(c.Request.Context(), req, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, org)
}

// ListOrganizations returns a list of organizations for the current user.
func (h *APIHandler) ListOrganizations(c *gin.Context) {
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	orgs, err := h.OrganizationService.ListOrganizations(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list organizations", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orgs)
}

// GetOrganization retrieves an organization by ID for the current user.
func (h *APIHandler) GetOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.GetOrganization(c.Request.Context(), orgID, user.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, org)
}

// UpdateOrganization updates an organization's details.
func (h *APIHandler) UpdateOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	var req models.UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	org, err := h.OrganizationService.UpdateOrganization(c.Request.Context(), orgID, req.Name, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, org)
}

// DeleteOrganization deletes an organization by ID.
func (h *APIHandler) DeleteOrganization(c *gin.Context) {
	orgID := c.Param("orgId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = h.OrganizationService.DeleteOrganization(c.Request.Context(), orgID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// --- Project Handlers ---

// CreateProject handles the creation of a new project.
func (h *APIHandler) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.CreateProject(c.Request.Context(), req, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, project)
}

// GetProject retrieves a project by ID for the current user.
func (h *APIHandler) GetProject(c *gin.Context) {
	projectID := c.Param("projectId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.GetProjectByID(c.Request.Context(), projectID, user.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

// ListProjects returns a list of projects for the current user.
func (h *APIHandler) ListProjects(c *gin.Context) {
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	projects, err := h.ProjectService.ListProjects(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list projects", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, projects)
}

// UpdateProject updates a project's details.
func (h *APIHandler) UpdateProject(c *gin.Context) {
	projectID := c.Param("projectId")
	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.UpdateProject(c.Request.Context(), projectID, req, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project by ID.
func (h *APIHandler) DeleteProject(c *gin.Context) {
	projectID := c.Param("projectId")
	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = h.ProjectService.DeleteProject(c.Request.Context(), projectID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Project deletion initiated"})
}

// --- Resource Handlers ---

// CreateResource handles the creation of a new resource in a project.
func (h *APIHandler) CreateResource(c *gin.Context) {
	projectID := c.Param("projectId")
	var req models.CreateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.CreateResource(c.Request.Context(), projectID, req, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to create resource" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create resource"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resource)
}

// GetResource retrieves a resource by ID for the current user.
func (h *APIHandler) GetResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.GetResourceByID(c.Request.Context(), projectID, resourceID, user.ID)
	if err != nil {
		// Always return 404 for security - don't reveal if resource exists but user lacks access
		c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
		return
	}
	c.JSON(http.StatusOK, resource)
}

// ListResources returns a list of resources for a project.
func (h *APIHandler) ListResources(c *gin.Context) {
	projectID := c.Param("projectId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resources, err := h.ResourceService.ListResources(c.Request.Context(), projectID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list resources", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resources)
}

// UpdateResource updates a resource's details.
func (h *APIHandler) UpdateResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	var req models.UpdateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	resource, err := h.ResourceService.UpdateResource(c.Request.Context(), projectID, resourceID, req, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to update resource" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to update resource"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resource)
}

// DeleteResource deletes a resource by ID.
func (h *APIHandler) DeleteResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	err = h.ResourceService.DeleteResource(c.Request.Context(), projectID, resourceID, user.ID)
	if err != nil {
		if err.Error() == "insufficient permissions to delete resource" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete resource"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Resource deletion initiated"})
}

// --- RBAC Handlers ---

// ListRoles returns all available roles in the system.
func (h *APIHandler) ListRoles(c *gin.Context) {
	// For now, return hardcoded system roles
	// In a real implementation, you'd fetch from database
	roles := []models.Role{
		{
			RoleID:      "role-1",
			Name:        "Owner",
			DisplayName: "Owner",
			Description: "Full access to all resources and settings",
			IsSystem:    true,
		},
		{
			RoleID:      "role-2",
			Name:        "Editor",
			DisplayName: "Editor",
			Description: "Can create, edit, and delete resources",
			IsSystem:    true,
		},
		{
			RoleID:      "role-3",
			Name:        "Viewer",
			DisplayName: "Viewer",
			Description: "Read-only access to resources",
			IsSystem:    true,
		},
	}

	c.JSON(http.StatusOK, roles)
}

// SearchUsers searches for users by query string.
func (h *APIHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" || len(query) < 2 {
		c.JSON(http.StatusOK, []models.User{})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// --- Project RBAC Handlers ---

// ListProjectRoleAssignments lists all role assignments for a project.
func (h *APIHandler) ListProjectRoleAssignments(c *gin.Context) {
	projectID := c.Param("projectId")

	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "project", projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateProjectRoleAssignment assigns a role to a user for a project.
func (h *APIHandler) CreateProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")

	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		RoleName string `json:"role_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Validate user exists and is unique
	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleName, "project", projectID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Role assignment created",
		"project_id":  projectID,
		"user_id":     req.UserID,
		"role":        req.RoleName,
		"assigned_by": user.ID,
	})
}

// DeleteProjectRoleAssignment deletes a role assignment from a project.
func (h *APIHandler) DeleteProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "project", projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
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
func (h *APIHandler) ListResourceRoleAssignments(c *gin.Context) {
	_ = c.Param("projectId") // TODO: use projectID for additional validation
	resourceID := c.Param("resourceId")

	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "resource", resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateResourceRoleAssignment assigns a role to a user for a resource.
func (h *APIHandler) CreateResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		RoleName string `json:"role_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleName, "resource", resourceID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Role assignment created",
		"project_id":  projectID,
		"resource_id": resourceID,
		"user_id":     req.UserID,
		"role":        req.RoleName,
		"assigned_by": user.ID,
	})
}

// DeleteResourceRoleAssignment deletes a role assignment from a resource.
func (h *APIHandler) DeleteResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "resource", resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
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
func (h *APIHandler) ListOrganizationRoleAssignments(c *gin.Context) {
	orgID := c.Param("orgId")

	assignments, err := h.RBACService.GetRoleAssignmentsForScope(c.Request.Context(), "organization", orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateOrganizationRoleAssignment assigns a role to a user for an organization.
func (h *APIHandler) CreateOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")

	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		RoleName string `json:"role_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	users, err := h.RBACService.SearchUsers(c.Request.Context(), req.UserID)
	if err != nil || len(users) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found for given user_id"})
		return
	}
	if len(users) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ambiguous user_id, multiple users found"})
		return
	}

	err = h.RBACService.AssignRole(c.Request.Context(), req.UserID, req.RoleName, "organization", orgID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "Role assignment created",
		"organization_id": orgID,
		"user_id":         req.UserID,
		"role":            req.RoleName,
		"assigned_by":     user.ID,
	})
}

// DeleteOrganizationRoleAssignment deletes a role assignment from an organization.
func (h *APIHandler) DeleteOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")
	assignmentID := c.Param("assignmentId")

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_access", "organization", orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}
	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete role assignment"})
		return
	}

	err = h.RBACService.DeleteRoleAssignment(c, assignmentID)
	if err != nil {
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
func (h *APIHandler) GetBillingInfo(c *gin.Context) {
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to view billing information"})
		return
	}

	billingInfo, err := h.BillingService.GetBillingInfo(scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get billing information", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, billingInfo)
}

// UpdateBillingInfo updates billing settings for organization or project.
func (h *APIHandler) UpdateBillingInfo(c *gin.Context) {
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

	var req models.UpdateBillingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	account, err := h.BillingService.UpdateBillingAccount(scopeType, scopeID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update billing information", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// CreateStripeCustomer creates a Stripe customer for organization or project.
func (h *APIHandler) CreateStripeCustomer(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	account, err := h.BillingService.CreateStripeCustomer(scopeType, scopeID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Stripe customer", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// CreateStripeSubscription creates a Stripe subscription for organization or project.
func (h *APIHandler) CreateStripeSubscription(c *gin.Context) {
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
		fmt.Printf("JSON binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Request parsed successfully: %+v\n", req)

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
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
		fmt.Printf("Billing service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// CreateStripeCustomerPortal creates a Stripe customer portal session for organization or project.
func (h *APIHandler) CreateStripeCustomerPortal(c *gin.Context) {
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	portalURL, err := h.BillingService.CreateStripeCustomerPortal(scopeType, scopeID, req.ReturnURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer portal", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"portal_url": portalURL})
}

// CancelSubscription cancels a Stripe subscription for organization or project.
func (h *APIHandler) CancelSubscription(c *gin.Context) {
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check manage_billing permission
	hasPermission, err := h.RBACService.CheckPermission(c, user.ID, "manage_billing", scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions", "details": err.Error()})
		return
	}

	if !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to manage billing"})
		return
	}

	account, err := h.BillingService.CancelSubscription(scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel subscription", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ListPermissionsHandler returns all permissions (actions) the current user has for a given scope.
func (h *APIHandler) ListPermissionsHandler(c *gin.Context) {
	scopeType := c.Query("scopeType")
	scopeID := c.Query("scopeId")
	if scopeType == "" || scopeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing scopeType or scopeId"})
		return
	}

	user, err := h.getUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	permissions, err := h.RBACService.ListPermissions(c.Request.Context(), user.ID, scopeType, scopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list permissions", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}
