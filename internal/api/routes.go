// ...existing code...
package api

import (
	"context"
	"ktrlplane/internal/auth" // Import auth package
	"ktrlplane/internal/db"
	"time"

	"github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router with all routes and middleware.
func SetupRouter(handler *Handler) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(CustomRecoveryMiddleWare())
	r.Use(ErrorLoggerMiddleware())
	r.Use(CORSMiddleware())

	// --- Public Routes (Example: Health Check) ---
	r.GET("/health", func(c *gin.Context) {
		pool := db.GetDB()
		if pool == nil {
			c.JSON(503, gin.H{"status": "DOWN", "error": "DB pool not initialized"})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		conn, err := pool.Acquire(ctx)
		if err != nil {
			c.JSON(503, gin.H{"status": "DOWN", "error": err.Error()})
			return
		}
		defer conn.Release()
		var one int
		err = conn.QueryRow(ctx, "SELECT 1").Scan(&one)
		if err != nil || one != 1 {
			c.JSON(503, gin.H{"status": "DOWN", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "UP"})
	})

	// API v1 routes
	apiV1 := r.Group("/api/v1")
	
	// Public route to get resource tier pricing info
	apiV1.GET("/resource-pricing", handler.GetResourceTierPrice) // Get resource tier pricing info

	// Apply Auth middleware to all other /api/v1 routes
	apiV1.Use(auth.Middleware()) // Enable Auth middleware
	{
		// --- Global RBAC Routes ---
		apiV1.GET("/roles", handler.ListRoles)                               // List all available roles
		apiV1.GET("/roles/:roleId/permissions", handler.ListRolePermissions) // List permissions for a specific role
		apiV1.GET("/users/search", handler.SearchUsers)                      // Search users
		apiV1.GET("/permissions/check", handler.ListPermissionsHandler)      // List all permissions for current user/scope

		// --- Organization Routes ---
		organizations := apiV1.Group("/organizations")
		{
			organizations.POST("", handler.CreateOrganization) // Create Organization
			organizations.GET("", handler.ListOrganizations)   // List Organizations user has access to

			organizationDetail := organizations.Group("/:orgId")
			{
				organizationDetail.GET("", handler.GetOrganization)       // Get specific organization details
				organizationDetail.PUT("", handler.UpdateOrganization)    // Update Organization
				organizationDetail.DELETE("", handler.DeleteOrganization) // Delete Organization

				// Organization RBAC routes
				orgRBAC := organizationDetail.Group("/rbac")
				{
					orgRBAC.GET("", handler.ListOrganizationRoleAssignments)                   // List role assignments
					orgRBAC.POST("", handler.CreateOrganizationRoleAssignment)                 // Assign role
					orgRBAC.DELETE("/:assignmentId", handler.DeleteOrganizationRoleAssignment) // Remove role assignment
				}

				// Organization Billing routes
				orgBilling := organizationDetail.Group("/billing")
				{
					orgBilling.GET("", handler.GetBillingInfo)                                // Get billing information
					orgBilling.POST("/customer", handler.CreateStripeCustomer)                // Create Stripe customer
					orgBilling.POST("/subscription", handler.CreateStripeSubscription)        // Create subscription
					orgBilling.POST("/portal", handler.CreateStripeCustomerPortal)            // Create customer portal session
					orgBilling.POST("/cancel", handler.CancelSubscription)                    // Cancel subscription
					orgBilling.GET("/billing/status", handler.GetBillingStatus)               // Billing status endpoint for onboarding/payment enforcement
					orgBilling.POST("/billing/setup-intent", handler.CreateStripeSetupIntent) // Stripe SetupIntent endpoint for payment onboarding
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
				projectDetail.GET("", handler.GetProject)       // Get specific project details
				projectDetail.PUT("", handler.UpdateProject)    // Update Project
				projectDetail.DELETE("", handler.DeleteProject) // Delete Project (Requires owner role)

				// Project RBAC routes
				projectRBAC := projectDetail.Group("/rbac")
				{
					projectRBAC.GET("", handler.ListProjectRoleAssignments)                   // List role assignments
					projectRBAC.POST("", handler.CreateProjectRoleAssignment)                 // Assign role
					projectRBAC.DELETE("/:assignmentId", handler.DeleteProjectRoleAssignment) // Remove role assignment
				}

				// Project Billing routes
				projectBilling := projectDetail.Group("/billing")
				{
					projectBilling.GET("", handler.GetBillingInfo)                         // Get billing information
					projectBilling.POST("/customer", handler.CreateStripeCustomer)         // Create Stripe customer
					projectBilling.POST("/subscription", handler.CreateStripeSubscription) // Create subscription
					projectBilling.POST("/portal", handler.CreateStripeCustomerPortal)     // Create customer portal session
					projectBilling.POST("/cancel", handler.CancelSubscription)             // Cancel subscription
					projectBilling.GET("/status", handler.GetBillingStatus)                // Billing status endpoint for onboarding/payment enforcement
					projectBilling.POST("/setup-intent", handler.CreateStripeSetupIntent)  // Stripe SetupIntent endpoint for payment onboarding
				}

				// --- Resource Routes (nested under project) ---
				resources := projectDetail.Group("/resources")
				{
					resources.POST("", handler.CreateResource) // Create Resource (Editor role)
					resources.GET("", handler.ListResources)   // List resources in the project (Viewer role)

					resourceDetail := resources.Group("/:resourceId")
					{
						resourceDetail.GET("", handler.GetResource)       // Get specific resource details (Viewer role)
						resourceDetail.PUT("", handler.UpdateResource)    // Update Resource (Editor role)
						resourceDetail.DELETE("", handler.DeleteResource) // Delete Resource (Editor role) // Or owner?

						// Resource RBAC routes
						resourceRBAC := resourceDetail.Group("/rbac")
						{
							resourceRBAC.GET("", handler.ListResourceRoleAssignments)                   // List role assignments
							resourceRBAC.POST("", handler.CreateResourceRoleAssignment)                 // Assign role
							resourceRBAC.DELETE("/:assignmentId", handler.DeleteResourceRoleAssignment) // Remove role assignment
						}

						// --- Logging & Metrics Proxy Endpoints ---
						resourceDetail.GET("/logs", handler.LogsProxyHandler)                   // Loki logs proxy
						resourceDetail.GET("/metrics/query_range", handler.MetricsProxyHandler) // Mimir metrics proxy
					}
				}

				// --- Secret Routes (nested under project) ---
				secrets := projectDetail.Group("/secrets")
				{
					secrets.GET("/:secretName", handler.GetProjectSecret) // Get specific secret (requires read permission on project)
				}
			}
		}
	}

	return r
}
