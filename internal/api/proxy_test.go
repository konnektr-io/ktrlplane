package api

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestProxyService_Creation(t *testing.T) {
	// Test that proxy service can be created successfully
	lokiURL, err := url.Parse("http://localhost:3100")
	assert.NoError(t, err)

	mimirURL, err := url.Parse("http://localhost:9009")
	assert.NoError(t, err)

	proxyService := NewProxyService(nil, lokiURL, mimirURL)
	assert.NotNil(t, proxyService)
	assert.Equal(t, lokiURL, proxyService.lokiURL)
	assert.Equal(t, mimirURL, proxyService.mimirURL)
}

func TestProxyService_LogsProxyDisabled(t *testing.T) {
	// Test logs proxy when Loki is not configured
	proxyService := NewProxyService(nil, nil, nil)

	req := httptest.NewRequest("GET", "/logs", nil)
	w := httptest.NewRecorder()

	proxyService.LogsProxy().ServeHTTP(w, req)

	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
	assert.Contains(t, w.Body.String(), "Loki backend not configured")
}

func TestProxyService_MetricsProxyDisabled(t *testing.T) {
	// Test metrics proxy when Mimir is not configured
	proxyService := NewProxyService(nil, nil, nil)

	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()

	proxyService.MetricsProxy().ServeHTTP(w, req)

	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
	assert.Contains(t, w.Body.String(), "Mimir backend not configured")
}

func TestProxyService_URLParsing(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid HTTP URL", "http://localhost:3100", true},
		{"Valid HTTPS URL", "https://loki.example.com:3100", true},
		{"Relative URL", "not-a-valid-url", false}, // This is parsed as relative URL
		{"Empty URL", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url, err := url.Parse(tt.input)
			assert.NoError(t, err) // url.Parse rarely returns errors
			assert.NotNil(t, url)

			// Check if it's a valid absolute URL with scheme and host
			isValid := url.Scheme != "" && url.Host != ""
			assert.Equal(t, tt.wantValid, isValid)
		})
	}
}
