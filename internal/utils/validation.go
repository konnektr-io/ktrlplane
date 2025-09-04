package utils

import (
	"fmt"
	"regexp"
	"strings"
)

// ValidateDNSID validates that an ID meets DNS requirements:
// - 1-63 characters long
// - Starts with a letter
// - Contains only lowercase letters, numbers, and hyphens
// - Does not end with a hyphen
// - Does not contain consecutive hyphens
func ValidateDNSID(id string) error {
	if len(id) == 0 {
		return fmt.Errorf("ID cannot be empty")
	}

	if len(id) > 63 {
		return fmt.Errorf("ID cannot be longer than 63 characters")
	}

	// Must start with a letter
	if !regexp.MustCompile(`^[a-z]`).MatchString(id) {
		return fmt.Errorf("ID must start with a lowercase letter")
	}

	// Must contain only lowercase letters, numbers, and hyphens
	if !regexp.MustCompile(`^[a-z0-9-]+$`).MatchString(id) {
		return fmt.Errorf("ID can only contain lowercase letters, numbers, and hyphens")
	}

	// Cannot end with a hyphen
	if strings.HasSuffix(id, "-") {
		return fmt.Errorf("ID cannot end with a hyphen")
	}

	// Cannot contain consecutive hyphens
	if strings.Contains(id, "--") {
		return fmt.Errorf("ID cannot contain consecutive hyphens")
	}

	return nil
}
