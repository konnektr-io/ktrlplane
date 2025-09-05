package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateDNSID(t *testing.T) {
	tests := []struct {
		id      string
		wantErr bool
		name    string
	}{
		{"my-project-4f2a", false, "valid: lowercase, hyphen, suffix"},
		{"production-db", false, "valid: lowercase, hyphen"},
		{"test123", false, "valid: lowercase, numbers"},
		{"123invalid", true, "invalid: starts with number"},
		{"my--project", true, "invalid: consecutive hyphens"},
		{"project-", true, "invalid: ends with hyphen"},
		{"My-Project", true, "invalid: uppercase"},
		{"project_name", true, "invalid: underscore"},
		{"", true, "invalid: empty"},
		{"very-long-name-that-is-way-too-long-and-exceeds-the-maximum-allowed-length", true, "invalid: too long"},
	}

	for _, tt := range tests {
		err := ValidateDNSID(tt.id)
		if tt.wantErr {
			assert.Error(t, err, tt.name+": expected error for id '", tt.id, "'")
		} else {
			assert.NoError(t, err, tt.name+": expected no error for id '", tt.id, "'")
		}
	}
}
