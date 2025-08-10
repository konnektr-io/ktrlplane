package service

import (
	"context"
	"ktrlplane/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/mock"
)

// MockRBACService for testing
type MockRBACService struct {
	mock.Mock
}

func (m *MockRBACService) AssignRole(ctx context.Context, userID, roleName, scopeType, scopeID, assignedBy string) error {
	args := m.Called(ctx, userID, roleName, scopeType, scopeID, assignedBy)
	return args.Error(0)
}

func (m *MockRBACService) AssignRoleInTx(ctx context.Context, tx pgx.Tx, userID, roleName, scopeType, scopeID, assignedBy string) error {
	args := m.Called(ctx, tx, userID, roleName, scopeType, scopeID, assignedBy)
	return args.Error(0)
}

func (m *MockRBACService) CheckPermission(ctx context.Context, userID, action, scopeType, scopeID string) (bool, error) {
	args := m.Called(ctx, userID, action, scopeType, scopeID)
	return args.Bool(0), args.Error(1)
}

func (m *MockRBACService) GetUserRoles(ctx context.Context, userID string) ([]models.RoleAssignment, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.RoleAssignment), args.Error(1)
}

// MockOrganizationService for testing
type MockOrganizationService struct {
	mock.Mock
}

func (m *MockOrganizationService) CreateOrganization(ctx context.Context, name, ownerUserID string) (*models.Organization, error) {
	args := m.Called(ctx, name, ownerUserID)
	return args.Get(0).(*models.Organization), args.Error(1)
}

func (m *MockOrganizationService) ListOrganizations(ctx context.Context, userID string) ([]models.Organization, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.Organization), args.Error(1)
}

func (m *MockOrganizationService) GetOrganization(ctx context.Context, orgID, userID string) (*models.Organization, error) {
	args := m.Called(ctx, orgID, userID)
	return args.Get(0).(*models.Organization), args.Error(1)
}

func (m *MockOrganizationService) UpdateOrganization(ctx context.Context, orgID, name, userID string) (*models.Organization, error) {
	args := m.Called(ctx, orgID, name, userID)
	return args.Get(0).(*models.Organization), args.Error(1)
}

func (m *MockOrganizationService) DeleteOrganization(ctx context.Context, orgID, userID string) error {
	args := m.Called(ctx, orgID, userID)
	return args.Error(0)
}
