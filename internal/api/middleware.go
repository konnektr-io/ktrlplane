package api

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// ErrorHandlingMiddleware logs errors and returns a JSON error response for 500 errors
func ErrorHandlingMiddleware() gin.HandlerFunc {
   return func(c *gin.Context) {
	   c.Next()
	   // Only run if there are errors to handle
	   if len(c.Errors) > 0 {
		   for _, e := range c.Errors {
			   log.Printf("[GIN][ERROR] %v", e.Err)
		   }
		   // If not already written, return a generic error
		   if !c.Writer.Written() {
			   c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		   }
	   }
   }
}

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
