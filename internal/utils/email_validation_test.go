package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsValidEmail(t *testing.T) {
	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{
			name:     "Valid email - standard format",
			email:    "user@example.com",
			expected: true,
		},
		{
			name:     "Valid email - with plus sign",
			email:    "user+tag@example.com",
			expected: true,
		},
		{
			name:     "Valid email - with dots",
			email:    "first.last@example.com",
			expected: true,
		},
		{
			name:     "Valid email - subdomain",
			email:    "user@mail.example.com",
			expected: true,
		},
		{
			name:     "Valid email - with numbers",
			email:    "user123@example456.com",
			expected: true,
		},
		{
			name:     "Valid email - with hyphen in domain",
			email:    "user@my-company.com",
			expected: true,
		},
		{
			name:     "Invalid email - no @",
			email:    "userexample.com",
			expected: false,
		},
		{
			name:     "Invalid email - no domain",
			email:    "user@",
			expected: false,
		},
		{
			name:     "Invalid email - no TLD",
			email:    "user@example",
			expected: false,
		},
		{
			name:     "Invalid email - multiple @",
			email:    "user@@example.com",
			expected: false,
		},
		{
			name:     "Invalid email - spaces",
			email:    "user @example.com",
			expected: false,
		},
		{
			name:     "Invalid email - empty string",
			email:    "",
			expected: false,
		},
		{
			name:     "Invalid email - just @",
			email:    "@",
			expected: false,
		},
		{
			name:     "Invalid email - TLD too short",
			email:    "user@example.c",
			expected: false,
		},
		{
			name:     "Valid email - long TLD",
			email:    "user@example.museum",
			expected: true,
		},
		{
			name:     "Invalid email - special characters in local part",
			email:    "user!#$%@example.com",
			expected: false,
		},
		{
			name:     "Invalid email - Auth0 user ID",
			email:    "auth0|123456789",
			expected: false,
		},
		{
			name:     "Invalid email - UUID",
			email:    "550e8400-e29b-41d4-a716-446655440000",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidEmail(tt.email)
			assert.Equal(t, tt.expected, result, "IsValidEmail(%q) should be %v", tt.email, tt.expected)
		})
	}
}
