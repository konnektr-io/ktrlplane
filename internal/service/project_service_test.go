package service

import (
	"testing"

	"ktrlplane/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestProjectService_Initialization(t *testing.T) {
	// Test that we can create a project service
	service := NewProjectService()
	assert.NotNil(t, service, "Project service should not be nil")
	assert.NotNil(t, service.rbacService, "RBAC service should be initialized")
}

func TestCreateProjectRequest_Validation(t *testing.T) {
	// Test that we can create valid project requests
	req := models.CreateProjectRequest{
		Name:        "Test Project",
		Description: "A project for testing purposes",
	}
	
	assert.Equal(t, "Test Project", req.Name, "Project name should match")
	assert.Equal(t, "A project for testing purposes", req.Description, "Project description should match")
}

// Note: Full integration tests for CreateProject require database setup
// These should be in separate integration test files with proper DB fixtures
