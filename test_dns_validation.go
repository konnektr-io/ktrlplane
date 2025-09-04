package main

import (
	"fmt"
	"ktrlplane/internal/utils"
)

func main() {
	testCases := []string{
		"my-project-4f2a", // Valid
		"production-db",   // Valid
		"test123",         // Valid
		"123invalid",      // Invalid - starts with number
		"my--project",     // Invalid - consecutive hyphens
		"project-",        // Invalid - ends with hyphen
		"My-Project",      // Invalid - uppercase
		"project_name",    // Invalid - underscore
		"",                // Invalid - empty
		"very-long-name-that-is-way-too-long-and-exceeds-the-maximum-allowed-length", // Invalid - too long
	}

	fmt.Println("Testing DNS ID validation:")
	for _, testCase := range testCases {
		err := utils.ValidateDNSID(testCase)
		if err != nil {
			fmt.Printf("❌ '%s': %s\n", testCase, err.Error())
		} else {
			fmt.Printf("✅ '%s': Valid\n", testCase)
		}
	}
}
