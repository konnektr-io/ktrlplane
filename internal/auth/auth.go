package auth

import (
	"fmt"
	"ktrlplane/internal/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	// Example using auth0 jwtmiddleware
	// jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	// "github.com/auth0/go-jwt-middleware/v2/validator"
	// Replace with your actual JWT validation library and logic
)

// Placeholder for Auth0 configuration needed by middleware
var (
	// jwtValidator *validator.Validator
	apiAudience string
	auth0Domain string
)

func SetupAuth(audience, domain string) error {
	apiAudience = audience
	auth0Domain = domain
	// Initialize your actual JWT validator here based on domain/audience
	// Example:
	// keyFunc := func(ctx context.Context) (interface{}, error) { ... } // Fetch JWKS
	// jwtValidator, err := validator.New(keyFunc, validator.RS256, ...)
	// if err != nil { return fmt.Errorf("failed to set up jwt validator: %w", err) }
	fmt.Println("Auth placeholder setup complete. Implement actual JWT validation.")
	return nil
}

// AuthMiddleware validates the JWT token. Placeholder implementation.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Implement actual JWT validation
		// For development, we'll create a mock user and skip token validation
		mockUser := models.User{
			ID:    "dev-user-123",
			Email: "dev@ktrlplane.local",
		}
		c.Set("user", mockUser)
		c.Next()
	}
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
