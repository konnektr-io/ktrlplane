package main

import (
	"context"
	"fmt"
	"ktrlplane/internal/config"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Debug: print loaded config
	log.Printf("Loaded config: %+v", cfg)

	// Connect to database
	connString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.DBName, cfg.Database.SSLMode)

	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	// Create migrations table if it doesn't exist
	_, err = pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create migrations table: %v", err)
	}

	// Run migrations
	err = runMigrations(pool)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	fmt.Println("Migrations completed successfully!")
}

func runMigrations(pool *pgxpool.Pool) error {
	// Get list of applied migrations
	rows, err := pool.Query(context.Background(), "SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("failed to query migrations: %w", err)
	}
	defer rows.Close()

	appliedMigrations := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return fmt.Errorf("failed to scan migration version: %w", err)
		}
		version = trimString(version)
		appliedMigrations[version] = true
	}

	// Debug: print applied migrations
	log.Printf("Applied migrations: %v", appliedMigrations)

	// Get list of migration files
	migrationFiles, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		return fmt.Errorf("failed to list migration files: %w", err)
	}

	sort.Strings(migrationFiles)

	// Debug: print migration files found
	log.Printf("Migration files found: %v", migrationFiles)

	// Apply pending migrations
	for _, file := range migrationFiles {
		filename := filepath.Base(file)
		version := trimString(filename[:3]) // Extract version from filename (e.g., "001" from "001_initial_schema.sql")

		if appliedMigrations[version] {
			fmt.Printf("Migration %s already applied, skipping\n", filename)
			continue
		}

		fmt.Printf("Applying migration %s...\n", filename)

		// Read migration file
		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		// Execute migration
		_, err = pool.Exec(context.Background(), string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		// Record migration as applied
		_, err = pool.Exec(context.Background(),
			"INSERT INTO schema_migrations (version) VALUES ($1)",
			version)
		if err != nil {
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		fmt.Printf("Migration %s applied successfully\n", filename)
	}

	return nil
}

// trimString trims whitespace and newlines from a string
func trimString(s string) string {
	return strings.TrimSpace(s)
}
