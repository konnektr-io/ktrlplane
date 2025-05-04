package service

import (
	"context"
	"testing"

	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v3"
	"github.com/stretchr/testify/assert"
)

func TestCreateProject(t *testing.T) {
	// Create a new pgxmock connection
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err, "pgxmock should initialize without error")
	defer mock.Close()

	// Mock the ExecQuery function
	db.MockExecQuery = func(ctx context.Context, query string, args ...interface{}) error {
		mock.ExpectExec(query).WithArgs(args...).WillReturnResult(pgxmock.NewResult("INSERT", 1))
		return nil
	}
	defer func() { db.MockExecQuery = nil }() // Reset the mock after the test

	// Mock the Query function
	db.MockQuery = func(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error) {
		columns := []string{"project_id", "name", "description", "status", "created_at", "updated_at"}
		mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(
			mock.NewRows(columns).AddRow("mock-project-id", "Mock Project", "This is a mock project description.", "Active", "2025-05-04T00:00:00Z", "2025-05-04T00:00:00Z"),
		)
		return mock.Query(ctx, query, args...)
	}
	defer func() { db.MockQuery = nil }() // Reset the mock after the test

	service := NewProjectService()
	ctx := context.Background()

	req := models.CreateProjectRequest{
		Name:        "Test Project",
		Description: "A project for testing purposes",
	}

	project, err := service.CreateProject(ctx, req)
	assert.NoError(t, err, "Creating a project should not return an error")
	assert.NotNil(t, project, "Created project should not be nil")
	assert.Equal(t, req.Name, project.Name, "Project name should match the request")
}
