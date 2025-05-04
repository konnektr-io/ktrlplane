package api

import (
	"ktrlplane/internal/auth" // Import auth package

	"github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router with all routes and middleware.
func SetupRouter(handler *APIHandler) *gin.Engine {
	r := gin.Default()

	// Apply CORS middleware globally
	r.Use(CORSMiddleware())

	// --- Public Routes (Example: Health Check) ---
	r.GET("/health", func(c *gin.Context) {
		// Placeholder: Check DB connection?
		c.JSON(200, gin.H{"status": "UP"})
	})

	// API v1 routes
	apiV1 := r.Group("/api/v1")

	// Apply Auth middleware to all /api/v1 routes
	apiV1.Use(auth.AuthMiddleware()) // Enable Auth middleware
	{
		// --- Project Routes ---
		projects := apiV1.Group("/projects")
		{
			projects.POST("", handler.CreateProject) // Create Project
			projects.GET("", handler.ListProjects)   // List Projects user has access to

			projectDetail := projects.Group("/:projectId")
			{
				projectDetail.GET("", handler.GetProject) // Get specific project details
				projectDetail.PUT("", handler.UpdateProject)   // Update Project
				projectDetail.DELETE("", handler.DeleteProject) // Delete Project (Requires owner role)

				// --- Resource Routes (nested under project) ---
				resources := projectDetail.Group("/resources")
				{
					resources.POST("", handler.CreateResource) // Create Resource (Editor role)
					resources.GET("", handler.ListResources)                                  // List resources in the project (Viewer role)

					resourceDetail := resources.Group("/:resourceId")
					{
						resourceDetail.GET("", handler.GetResource)                                      // Get specific resource details (Viewer role)
						resourceDetail.PUT("", handler.UpdateResource)    // Update Resource (Editor role)
						resourceDetail.DELETE("", handler.DeleteResource) // Delete Resource (Editor role) // Or owner?
					}
				}
			}
		}
	}

	return r
}
