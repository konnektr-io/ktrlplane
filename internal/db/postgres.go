package db

import (
	"context"
	"fmt"
	"ktrlplane/internal/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	dbPool        *pgxpool.Pool
	MockExecQuery func(ctx context.Context, query string, args ...interface{}) error
	MockQuery     func(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error)
)

// InitDB initializes the database connection pool.
func InitDB(cfg config.DatabaseConfig) error {
	connString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	poolConfig, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return fmt.Errorf("unable to parse connection string: %w", err)
	}

	dbPool, err = pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	fmt.Println("Database connection pool initialized.")
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
func ExecQuery(ctx context.Context, query string, args ...any) error {
	if MockExecQuery != nil {
		return MockExecQuery(ctx, query, args...)
	}

	conn, err := dbPool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire connection: %w", err)
	}
	defer conn.Release()

	_, err = conn.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("query execution failed: %w", err)
	}
	return nil
}

// Query executes a query and returns rows for processing.
func Query(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error) {
	if MockQuery != nil {
		return MockQuery(ctx, query, args...)
	}

	conn, err := dbPool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to acquire connection: %w", err)
	}

	rows, err := conn.Query(ctx, query, args...)
	if err != nil {
		conn.Release()
		return nil, fmt.Errorf("query execution failed: %w", err)
	}

	return rows, nil
}
