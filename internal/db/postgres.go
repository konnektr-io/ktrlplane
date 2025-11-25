package db

import (
	"context"
	"fmt"
	"ktrlplane/internal/config"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	// dbPool is the global database connection pool.
	dbPool *pgxpool.Pool
	// MockExecQuery is a mockable function for ExecQuery.
	MockExecQuery func(ctx context.Context, query string, args ...interface{}) error
	// MockQuery is a mockable function for Query.
	MockQuery func(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error)
)

// logPoolStats logs connection pool stats every 30 seconds
func logPoolStats() {
	go func() {
		for {
			if dbPool != nil {
				stats := dbPool.Stat()
				log.Printf("[DBPool] Total: %d, Idle: %d, Max: %d", stats.TotalConns(), stats.IdleConns(), stats.MaxConns())
			}
			time.Sleep(30 * time.Second)
		}
	}()
}

// InitDB initializes the database connection pool.
func InitDB(cfg config.DatabaseConfig) error {
	connString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	poolConfig, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return fmt.Errorf("unable to parse connection string: %w", err)
	}

	// Configure connection pool limits
	poolConfig.MaxConns = 20 // Increase from default 4 to handle concurrent requests
	poolConfig.MinConns = 2  // Keep minimum connections warm

	dbPool, err = pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	fmt.Println("Database connection pool initialized.")
	logPoolStats()
	return nil
}

// GetDB returns the database connection pool.
func GetDB() *pgxpool.Pool {
	return dbPool
}

// CloseDB closes the database connection pool.
func CloseDB() {
	if dbPool != nil {
		dbPool.Close()
		fmt.Println("Database connection pool closed.")
	}
}

// ExecQuery executes a query that doesn't return rows (e.g., INSERT, UPDATE, DELETE).
// Uses the pool directly for automatic connection management.
func ExecQuery(ctx context.Context, query string, args ...any) error {
	if MockExecQuery != nil {
		return MockExecQuery(ctx, query, args...)
	}

	// Use pool directly - it handles connection acquisition and release automatically
	_, err := dbPool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("query execution failed: %w", err)
	}
	return nil
}

// Query executes a query and returns rows for processing.
// DEPRECATED: This function leaks connections because it acquires a connection but never releases it.
// The connection stays busy until rows.Close() is called, causing pool exhaustion.
// Use db.GetDB().Query() directly instead and ensure proper defer rows.Close().
// This function is kept only for backwards compatibility with tests.
func Query(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error) {
	if MockQuery != nil {
		return MockQuery(ctx, query, args...)
	}

	// Use pool directly instead of acquiring a connection
	// This allows the pool to manage connection lifecycle properly
	return dbPool.Query(ctx, query, args...)
}
