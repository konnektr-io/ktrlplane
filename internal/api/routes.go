package api

import (
	"fmt"
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
		fmt.Println("Health endpoint called!")
		// Placeholder: Check DB connection?
		c.JSON(200, gin.H{"status": "UP"})
		fmt.Println("Health endpoint response sent!")
	})

	// API v1 routes
	apiV1 := r.Group("/api/v1")

	// Apply Auth middleware to all /api/v1 routes
	apiV1.Use(auth.AuthMiddleware()) // Enable Auth middleware
	{
		// --- Global RBAC Routes ---
		apiV1.GET("/roles", handler.ListRoles)                    // List all available roles
		apiV1.GET("/users/search", handler.SearchUsers)           // Search users

		// --- Organization Routes ---
		organizations := apiV1.Group("/organizations")
		{
			organizations.POST("", handler.CreateOrganization)   // Create Organization
			organizations.GET("", handler.ListOrganizations)     // List Organizations user has access to

			organizationDetail := organizations.Group("/:orgId")
			{
				organizationDetail.GET("", handler.GetOrganization)       // Get specific organization details
				organizationDetail.PUT("", handler.UpdateOrganization)    // Update Organization
				organizationDetail.DELETE("", handler.DeleteOrganization) // Delete Organization
				
				// Organization RBAC routes
				orgRBAC := organizationDetail.Group("/rbac")
				{
					orgRBAC.GET("", handler.ListOrganizationRoleAssignments)       // List role assignments
					orgRBAC.POST("", handler.CreateOrganizationRoleAssignment)    // Assign role
					orgRBAC.PUT("/:assignmentId", handler.UpdateOrganizationRoleAssignment) // Update role assignment
					orgRBAC.DELETE("/:assignmentId", handler.DeleteOrganizationRoleAssignment) // Remove role assignment
				}
			}
		}

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

				// Project RBAC routes
				projectRBAC := projectDetail.Group("/rbac")
				{
					projectRBAC.GET("", handler.ListProjectRoleAssignments)       // List role assignments
					projectRBAC.POST("", handler.CreateProjectRoleAssignment)    // Assign role
					projectRBAC.PUT("/:assignmentId", handler.UpdateProjectRoleAssignment) // Update role assignment
					projectRBAC.DELETE("/:assignmentId", handler.DeleteProjectRoleAssignment) // Remove role assignment
				}

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
						
						// Resource RBAC routes
						resourceRBAC := resourceDetail.Group("/rbac")
						{
							resourceRBAC.GET("", handler.ListResourceRoleAssignments)       // List role assignments
							resourceRBAC.POST("", handler.CreateResourceRoleAssignment)    // Assign role
							resourceRBAC.PUT("/:assignmentId", handler.UpdateResourceRoleAssignment) // Update role assignment
							resourceRBAC.DELETE("/:assignmentId", handler.DeleteResourceRoleAssignment) // Remove role assignment
						}
					}
				}
			}
		}
	}

	return r
}
