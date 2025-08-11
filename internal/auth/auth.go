package auth

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/gin-gonic/gin"
)

// CustomClaims contains custom data we want to get from the token.
type CustomClaims struct {
	Email string `json:"email"`
	Name string `json:"name"`
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
	
	// Cache for processed users to avoid repeated DB checks
	processedUsers = make(map[string]bool)
	userCacheMutex sync.RWMutex
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
		
		// Extract user information from token
		userID := claims.RegisteredClaims.Subject
		email := extractEmailFromClaims(claims)
		name := extractNameFromClaims(claims)
		
		// Ensure user exists in database (create or update)
		err = ensureUserExists(c.Request.Context(), userID, email, name)
		if err != nil {
			log.Printf("Failed to ensure user exists: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process user authentication"})
			c.Abort()
			return
		}
		
		// Create user object for context
		user := models.User{
			ID:    userID,
			Email: email,
		}

		// Store user in context
		c.Set("user", user)
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

// extractEmailFromClaims extracts email from JWT claims
func extractEmailFromClaims(claims *validator.ValidatedClaims) string {
	// First try to get email from custom claims (Auth0 email claim)
	if claims.CustomClaims != nil {
		if customClaims, ok := claims.CustomClaims.(*CustomClaims); ok {
			if customClaims.Email != "" {
				return customClaims.Email
			}
		}
	}
	
	// Fallback: Try to get email from subject if it looks like an email
	if claims.RegisteredClaims.Subject != "" && strings.Contains(claims.RegisteredClaims.Subject, "@") {
		return claims.RegisteredClaims.Subject
	}
	
	return "" // Return empty if email not found
}

// extractNameFromClaims extracts name from JWT claims
func extractNameFromClaims(claims *validator.ValidatedClaims) string {
	// First try to get name from custom claims (Auth0 name claim)
	if claims.CustomClaims != nil {
		if customClaims, ok := claims.CustomClaims.(*CustomClaims); ok {
			if customClaims.Name != "" {
				return customClaims.Name
			}
		}
	}
	
	// Fallback: extract name from email if available
	email := extractEmailFromClaims(claims)
	if email != "" {
		// Extract name part from email (before @)
		parts := strings.Split(email, "@")
		if len(parts) > 0 {
			return parts[0]
		}
	}
	return "User" // Default name
}

// ensureUserExists creates or updates a user in the database
func ensureUserExists(ctx context.Context, userID, email, name string) error {
	// Check cache first to avoid repeated DB calls
	userCacheMutex.RLock()
	if processedUsers[userID] {
		userCacheMutex.RUnlock()
		return nil // User already processed, skip
	}
	userCacheMutex.RUnlock()

	// Check if user exists and get their current email in one query
	var existingUserID, existingEmail, existingName string
	rows, err := db.Query(ctx, db.GetUserByIDQuery, userID)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	defer rows.Close()

	userExists := false
	if rows.Next() {
		err = rows.Scan(&existingUserID, &existingEmail, &existingName)
		if err != nil {
			return fmt.Errorf("failed to scan user data: %w", err)
		}
		userExists = true
	}
	rows.Close()

	if !userExists {
		// User doesn't exist, create them
		err = db.ExecQuery(ctx, db.CreateUserQuery, userID, email, name, userID)
		if err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
		log.Printf("Created new user: %s (%s)", email, userID)
	} else {
		// User exists, check if we need to update email or name
		needsUpdate := false
		updateFields := []string{}
		
		if email != "" && (existingEmail == "" || existingEmail != email) {
			err = db.ExecQuery(ctx, db.UpdateUserEmailQuery, userID, email)
			if err != nil {
				return fmt.Errorf("failed to update user email: %w", err)
			}
			updateFields = append(updateFields, "email")
			needsUpdate = true
		}
		
		if name != "" && (existingName == "" || existingName != name) {
			err = db.ExecQuery(ctx, db.UpdateUserNameQuery, userID, name)
			if err != nil {
				return fmt.Errorf("failed to update user name: %w", err)
			}
			updateFields = append(updateFields, "name")
			needsUpdate = true
		}
		
		if needsUpdate {
			log.Printf("Updated user %s: %v", userID, updateFields)
		}
	}

	// Add user to cache to avoid future checks
	userCacheMutex.Lock()
	processedUsers[userID] = true
	userCacheMutex.Unlock()

	return nil
}
