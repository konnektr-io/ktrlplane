package api

import (
	"fmt"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CustomRecoveryMiddleWare() gin.HandlerFunc {
  return func(c *gin.Context) {
    defer func() {
      if err := recover(); err != nil {
        // Log the error
        fmt.Printf("Panic occurred: %v\n", err)

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
