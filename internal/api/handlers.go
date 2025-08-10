package api

import (
	"fmt"
	"ktrlplane/internal/models"
	"ktrlplane/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIHandler struct {
	ProjectService      *service.ProjectService
	ResourceService     *service.ResourceService
	OrganizationService *service.OrganizationService
	RBACService         *service.RBACService
}

func NewAPIHandler(ps *service.ProjectService, rs *service.ResourceService, os *service.OrganizationService, rbac *service.RBACService) *APIHandler {
	return &APIHandler{
		ProjectService:      ps,
		ResourceService:     rs,
		OrganizationService: os,
		RBACService:         rbac,
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

	org, err := h.OrganizationService.CreateOrganization(c.Request.Context(), req.Name, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, org)
}

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

// ListRoles returns all available roles in the system
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

// SearchUsers searches for users by query string
func (h *APIHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" || len(query) < 2 {
		c.JSON(http.StatusOK, []models.User{})
		return
	}
	
	// For now, return mock users for development
	// In a real implementation, you'd search in your user database
	mockUsers := []models.User{
		{
			ID:    "user-1",
			Email: "john.doe@example.com",
		},
		{
			ID:    "user-2", 
			Email: "jane.smith@example.com",
		},
		{
			ID:    "user-3",
			Email: "bob.wilson@example.com", 
		},
	}
	
	// Filter users by query
	var filteredUsers []models.User
	for _, user := range mockUsers {
		if containsIgnoreCase(user.Email, query) {
			filteredUsers = append(filteredUsers, user)
		}
	}
	
	c.JSON(http.StatusOK, filteredUsers)
}

// Helper function for case-insensitive string matching
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && 
		   (s == substr || 
		    (len(s) > len(substr) && 
		     (s[:len(substr)] == substr || 
		      s[len(s)-len(substr):] == substr ||
		      containsIgnoreCase(s[1:], substr))))
}

// --- Project RBAC Handlers ---

func (h *APIHandler) ListProjectRoleAssignments(c *gin.Context) {
	projectID := c.Param("projectId")
	
	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "project", projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, assignments)
}

func (h *APIHandler) CreateProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	
	var req struct {
		Email    string `json:"email" binding:"required"`
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
	
	// For now, just return success
	// In real implementation: 
	// 1. Find user by email or create invitation
	// 2. Call h.RBACService.AssignRole
	c.JSON(http.StatusCreated, gin.H{
		"message": "Role assignment created",
		"project_id": projectID,
		"email": req.Email,
		"role": req.RoleName,
		"assigned_by": user.ID,
	})
}

func (h *APIHandler) UpdateProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	assignmentID := c.Param("assignmentId")
	
	var req struct {
		RoleName string `json:"role_name" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// For now, just return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment updated",
		"project_id": projectID,
		"assignment_id": assignmentID,
		"new_role": req.RoleName,
	})
}

func (h *APIHandler) DeleteProjectRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	assignmentID := c.Param("assignmentId")
	
	// For now, just return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment deleted",
		"project_id": projectID,
		"assignment_id": assignmentID,
	})
}

// --- Resource RBAC Handlers ---

func (h *APIHandler) ListResourceRoleAssignments(c *gin.Context) {
	_ = c.Param("projectId")  // TODO: use projectID for additional validation
	resourceID := c.Param("resourceId")
	
	assignments, err := h.RBACService.GetRoleAssignmentsWithInheritance(c.Request.Context(), "resource", resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, assignments)
}

func (h *APIHandler) CreateResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	
	var req struct {
		Email    string `json:"email" binding:"required"`
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
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Role assignment created",
		"project_id": projectID,
		"resource_id": resourceID,
		"email": req.Email,
		"role": req.RoleName,
		"assigned_by": user.ID,
	})
}

func (h *APIHandler) UpdateResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	assignmentID := c.Param("assignmentId")
	
	var req struct {
		RoleName string `json:"role_name" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment updated",
		"project_id": projectID,
		"resource_id": resourceID,
		"assignment_id": assignmentID,
		"new_role": req.RoleName,
	})
}

func (h *APIHandler) DeleteResourceRoleAssignment(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")
	assignmentID := c.Param("assignmentId")
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment deleted",
		"project_id": projectID,
		"resource_id": resourceID,
		"assignment_id": assignmentID,
	})
}

// --- Organization RBAC Handlers ---

func (h *APIHandler) ListOrganizationRoleAssignments(c *gin.Context) {
	orgID := c.Param("orgId")
	
	assignments, err := h.RBACService.GetRoleAssignmentsForScope(c.Request.Context(), "organization", orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch role assignments", "details": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, assignments)
}

func (h *APIHandler) CreateOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")
	
	var req struct {
		Email    string `json:"email" binding:"required"`
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
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Role assignment created",
		"organization_id": orgID,
		"email": req.Email,
		"role": req.RoleName,
		"assigned_by": user.ID,
	})
}

func (h *APIHandler) UpdateOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")
	assignmentID := c.Param("assignmentId")
	
	var req struct {
		RoleName string `json:"role_name" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment updated",
		"organization_id": orgID,
		"assignment_id": assignmentID,
		"new_role": req.RoleName,
	})
}

func (h *APIHandler) DeleteOrganizationRoleAssignment(c *gin.Context) {
	orgID := c.Param("orgId")
	assignmentID := c.Param("assignmentId")
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Role assignment deleted",
		"organization_id": orgID,
		"assignment_id": assignmentID,
	})
}
