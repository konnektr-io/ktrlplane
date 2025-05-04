package api

import (
	"ktrlplane/internal/models"
	"ktrlplane/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIHandler struct {
	ProjectService  *service.ProjectService
	ResourceService *service.ResourceService
}

func NewAPIHandler(ps *service.ProjectService, rs *service.ResourceService) *APIHandler {
	return &APIHandler{
		ProjectService:  ps,
		ResourceService: rs,
	}
}

// --- Project Handlers ---

func (h *APIHandler) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.ProjectService.CreateProject(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, project)
}

func (h *APIHandler) GetProject(c *gin.Context) {
	projectID := c.Param("projectId")
	project, err := h.ProjectService.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

func (h *APIHandler) ListProjects(c *gin.Context) {
	projects, err := h.ProjectService.ListProjects(c.Request.Context())
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

	project, err := h.ProjectService.UpdateProject(c.Request.Context(), projectID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

func (h *APIHandler) DeleteProject(c *gin.Context) {
	projectID := c.Param("projectId")
	err := h.ProjectService.DeleteProject(c.Request.Context(), projectID)
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
