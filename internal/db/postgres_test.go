package db

import (
	"testing"

	"ktrlplane/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestInitDB(t *testing.T) {
	cfg := config.DatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "test_user",
		Password: "test_password",
		DBName:   "test_db",
		SSLMode:  "disable",
	}

	err := InitDB(cfg)
	assert.NoError(t, err, "Database initialization should not return an error")
	assert.NotNil(t, GetDB(), "Database pool should be initialized")

	CloseDB()
}
