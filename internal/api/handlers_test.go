package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthCheck(t *testing.T) {
	r := gin.Default()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "Health check should return status OK")
	assert.JSONEq(t, `{"status": "UP"}`, w.Body.String(), "Health check response should match")
}
