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
}

func NewAPIHandler(ps *service.ProjectService, rs *service.ResourceService, os *service.OrganizationService) *APIHandler {
	return &APIHandler{
		ProjectService:      ps,
		ResourceService:     rs,
		OrganizationService: os,
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

	resource, err := h.ResourceService.CreateResource(c.Request.Context(), projectID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resource)
}

func (h *APIHandler) GetResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	resource, err := h.ResourceService.GetResourceByID(c.Request.Context(), projectID, resourceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resource)
}

func (h *APIHandler) ListResources(c *gin.Context) {
	projectID := c.Param("projectId")

	resources, err := h.ResourceService.ListResources(c.Request.Context(), projectID)
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

	resource, err := h.ResourceService.UpdateResource(c.Request.Context(), projectID, resourceID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resource)
}

func (h *APIHandler) DeleteResource(c *gin.Context) {
	projectID := c.Param("projectId")
	resourceID := c.Param("resourceId")

	err := h.ResourceService.DeleteResource(c.Request.Context(), projectID, resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource", "details": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Resource deletion initiated"})
}
