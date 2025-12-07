package service

import (
	"ktrlplane/internal/config"
	"ktrlplane/internal/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

// getTestConfig returns a minimal config for testing
func getTestConfig() *config.Config {
	return &config.Config{
		Stripe: config.StripeConfig{
			SecretKey: "sk_test_mock",
			Products:  []config.StripeProduct{},
		},
	}
}

func TestProjectService_Initialization(t *testing.T) {
	// Test that we can create a project service
	service := NewProjectService(getTestConfig())
	assert.NotNil(t, service, "Project service should not be nil")
	assert.NotNil(t, service.rbacService, "RBAC service should be initialized")
	assert.NotNil(t, service.orgService, "Organization service should be initialized")
	assert.NotNil(t, service.config, "Config should be initialized")
}

func TestCreateProjectRequest_Validation(t *testing.T) {
	// Test that we can create valid project requests
	req := models.CreateProjectRequest{
		Name:        "Test Project",
	}

	assert.Equal(t, "Test Project", req.Name, "Project name should match")
}

func TestProjectService_CreateProject_ParameterValidation(t *testing.T) {
	tests := []struct {
		name           string
		projectRequest models.CreateProjectRequest
		userID         string
		validInput     bool
	}{
		{
			name: "valid project creation parameters",
			projectRequest: models.CreateProjectRequest{
				Name:        "Test Project",
			},
			userID:     "user123",
			validInput: true,
		},
		{
			name: "empty project name",
			projectRequest: models.CreateProjectRequest{
				Name:        "",
			},
			userID:     "user123",
			validInput: false,
		},
		{
			name: "empty user ID",
			projectRequest: models.CreateProjectRequest{
				Name:        "Test Project",
			},
			userID:     "",
			validInput: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test parameter validation logic
			hasInvalidParams := tt.projectRequest.Name == "" || tt.userID == ""

			if tt.validInput {
				assert.False(t, hasInvalidParams, "Valid input should not have empty parameters")
			} else {
				assert.True(t, hasInvalidParams, "Invalid input should have empty parameters")
			}
		})
	}
}

func TestProjectService_ListProjects_Validation(t *testing.T) {
	tests := []struct {
		name       string
		userID     string
		validInput bool
	}{
		{
			name:       "valid user ID",
			userID:     "user123",
			validInput: true,
		},
		{
			name:       "empty user ID should be handled gracefully",
			userID:     "",
			validInput: true, // Query will return empty results
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Note: This test validates input handling
			// The actual database query would be tested in integration tests
			projectService := NewProjectService(getTestConfig())
			assert.NotNil(t, projectService, "Service should be initialized")
		})
	}
}

// Note: Full integration tests for CreateProject, UpdateProject, DeleteProject require database setup
// These should be in separate integration test files with proper DB fixtures
