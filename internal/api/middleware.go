package api

import (
	"fmt"
	"log"
	"runtime/debug"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// ErrorLoggerMiddleware logs all errors attached to the Gin context (not just panics).
func ErrorLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		// Log all errors that occurred during the request
 		for _, err := range c.Errors {
 			log.Printf("[GIN][ERROR] %v", err.Err)
 		}
	}
}

// CustomRecoveryMiddleWare recovers from panics and returns a JSON error response.
func CustomRecoveryMiddleWare() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Log the error
 				log.Printf("Panic occurred: %v\nStacktrace:\n%s", err, debug.Stack())

				// Return a unified error response
				c.JSON(500, gin.H{
					"code":    500,
					"message": "Internal Server Error",
					"error":   fmt.Sprintf("%v", err),
				})
				c.Abort() // Stop further execution
			}
		}()
		c.Next()
	}
}

// CORSMiddleware configures CORS for the Gin router.
func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
