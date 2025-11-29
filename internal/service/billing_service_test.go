package service

import (
	"ktrlplane/internal/config"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBillingService_Initialization(t *testing.T) {
	cfg := config.Config{}
	service := NewBillingService(&cfg)
	assert.NotNil(t, service, "BillingService should not be nil")
	assert.Equal(t, &cfg, service.config, "Config should be set correctly")
}

func TestBillingService_ConfigValues(t *testing.T) {
	cfg := config.Config{}
	service := NewBillingService(&cfg)
	// You can add more config assertions here as needed
	assert.NotNil(t, service.config, "Config should not be nil")
}
