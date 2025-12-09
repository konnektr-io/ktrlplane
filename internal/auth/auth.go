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
	Name  string `json:"name"`
	Gty   string `json:"gty"` // Grant type - "client-credentials" for M2M tokens
}

// Validate does nothing for this example, but we need
// it to satisfy validator.CustomClaims interface.
// Validate does nothing for this example, but we need it to satisfy validator.CustomClaims interface.
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

// Placeholder for Auth0 configuration needed by middleware
var (
	jwtValidator *validator.Validator

	// Cache for processed users to avoid repeated DB checks
	processedUsers = make(map[string]bool)
	userCacheMutex sync.RWMutex

	// Per-user locks to prevent race conditions in ensureUserExists
 	userLocks sync.Map // map[string]*sync.Mutex
)

// SetupAuth configures JWT validation for Auth0.
func SetupAuth(audience, issuer string) error {
	issuerURL, err := url.Parse(issuer)
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
				   // Intentionally returns an empty CustomClaims struct to satisfy the validator.CustomClaims interface.
				   return &CustomClaims{}
			},
		),
		validator.WithAllowedClockSkew(time.Minute),
	)
	if err != nil {
		return fmt.Errorf("failed to set up the jwt validator: %w", err)
	}

	log.Printf("Auth JWT validation configured for issuer: %s, audience: %s", issuer, audience)
	return nil
}

// Middleware validates the JWT token.
func Middleware() gin.HandlerFunc {
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

		// Detect if this is a service account (M2M client credentials flow)
		// M2M tokens have gty (grant type) = "client-credentials"
		isServiceAccount := isM2MToken(token)

		// Only ensure user exists for regular users, not service accounts
		if !isServiceAccount {
			err = ensureUserExists(c.Request.Context(), userID, email, name)
			if err != nil {
				log.Printf("Failed to ensure user exists: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process user authentication"})
				c.Abort()
				return
			}
		}

		// Create user object for context
		user := models.User{
			ID:              userID,
			Email:           email,
			Name:            name,
			IsServiceAccount: isServiceAccount,
		}

		// Store user in context
		c.Set("user", user)
		c.Next()
	}
}

// isM2MToken checks if a token is from a machine-to-machine (M2M) client credentials flow.
// M2M tokens from Auth0 contain a "gty" (grant type) claim set to "client-credentials".
func isM2MToken(token interface{}) bool {
	if claims, ok := token.(*validator.ValidatedClaims); ok {
		// Check for gty claim in custom claims
		if claims.CustomClaims != nil {
			if customClaims, ok := claims.CustomClaims.(*CustomClaims); ok {
				return customClaims.Gty == "client-credentials"
			}
		}
	}
	return false
}

// extractEmailFromClaims extracts email from JWT claims.
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

// extractNameFromClaims extracts name from JWT claims.
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

// ensureUserExists creates or updates a user in the database.
func ensureUserExists(ctx context.Context, userID, email, name string) error {
	// Check cache first to avoid repeated DB calls
	userCacheMutex.RLock()
	if processedUsers[userID] {
		userCacheMutex.RUnlock()
		return nil // User already processed, skip
	}
	userCacheMutex.RUnlock()
	
	// Acquire per-user lock
	lockIface, _ := userLocks.LoadOrStore(userID, &sync.Mutex{})
	lock := lockIface.(*sync.Mutex)
	lock.Lock()
	defer lock.Unlock()

	pool := db.GetDB()

	// First, check if there's a placeholder user with this email (user_id = email)
	// This handles the invitation scenario where a user was invited before signing up
	if email != "" {
		var placeholderUserID, placeholderEmail, placeholderName string
		placeholderRows, err := pool.Query(ctx, db.FindPlaceholderUserByEmailQuery, email)
		if err != nil {
			return fmt.Errorf("failed to check for placeholder user: %w", err)
		}
		defer placeholderRows.Close()

		if placeholderRows.Next() {
			err = placeholderRows.Scan(&placeholderUserID, &placeholderEmail, &placeholderName)
			if err != nil {
				return fmt.Errorf("failed to scan placeholder user: %w", err)
			}
			placeholderRows.Close()

			// Placeholder user exists! Transfer their role assignments to the real user
			log.Printf("Found placeholder user %s, transferring role assignments to real user %s", placeholderUserID, userID)

			// Start a transaction for the transfer
			tx, err := pool.Begin(ctx)
			if err != nil {
				return fmt.Errorf("failed to begin transaction for placeholder transfer: %w", err)
			}
			defer tx.Rollback(ctx)

			// Create the real user first
			_, err = tx.Exec(ctx, db.CreateUserQuery, userID, email, name, userID)
			if err != nil && !strings.Contains(err.Error(), "duplicate key value") {
				return fmt.Errorf("failed to create real user during transfer: %w", err)
			}

			// Transfer all role assignments from placeholder to real user
			_, err = tx.Exec(ctx, db.TransferRoleAssignmentsQuery, placeholderUserID, userID)
			if err != nil {
				return fmt.Errorf("failed to transfer role assignments: %w", err)
			}

			// Delete the placeholder user
			_, err = tx.Exec(ctx, db.DeletePlaceholderUserQuery, placeholderUserID)
			if err != nil {
				return fmt.Errorf("failed to delete placeholder user: %w", err)
			}

			// Commit the transaction
			err = tx.Commit(ctx)
			if err != nil {
				return fmt.Errorf("failed to commit placeholder transfer: %w", err)
			}

			log.Printf("Successfully transferred role assignments from placeholder %s to real user %s", placeholderUserID, userID)

			// Add to cache and return
			userCacheMutex.Lock()
			processedUsers[userID] = true
			userCacheMutex.Unlock()

			return nil
		}
		placeholderRows.Close()
	}

	// No placeholder found, proceed with normal user creation/update flow
	// Check if user exists and get their current email in one query
	var existingUserID, existingEmail, existingName string
	rows, err := pool.Query(ctx, db.GetUserByIDQuery, userID)
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
			// If error is duplicate key, treat as benign race and proceed
			if strings.Contains(err.Error(), "duplicate key value") || strings.Contains(err.Error(), "SQLSTATE 23505") {
				log.Printf("User already created in parallel: %s (%s)", email, userID)
			} else {
				return fmt.Errorf("failed to create user: %w", err)
			}
		} else {
			log.Printf("Created new user: %s (%s)", email, userID)
		}
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

