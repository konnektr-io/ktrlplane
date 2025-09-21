package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Auth0    Auth0Config    `mapstructure:"auth0"`
	Stripe   StripeConfig   `mapstructure:"stripe"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
}

type DatabaseConfig struct {
	Host      string `mapstructure:"host"`
	Port      int    `mapstructure:"port"`
	User      string `mapstructure:"user"`
	Password  string `mapstructure:"password"`
	DBName    string `mapstructure:"dbname"`
	SSLMode   string `mapstructure:"sslmode"`
}

type Auth0Config struct {
	Domain   string `mapstructure:"domain"`
	Audience string `mapstructure:"audience"`
	ClientID string `mapstructure:"client_id"`
}

type StripeConfig struct {
	SecretKey           string            `mapstructure:"secret_key"`
	PublishableKey      string            `mapstructure:"publishable_key"`
	WebhookSecret       string            `mapstructure:"webhook_secret"`
	Products            []StripeProduct   `mapstructure:"products"`
}

type StripeProduct struct {
	ResourceType string `mapstructure:"resource_type"`
	SKU          string `mapstructure:"sku"`
	ProductID    string `mapstructure:"product_id"`
}

func LoadConfig(path string) (config Config, err error) {
	// Try to load from environment variables first
	if envConfig, err := loadFromEnv(); err == nil {
		return envConfig, nil
	}

	// Fallback to config file
	viper.AddConfigPath(path)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		return Config{}, fmt.Errorf("fatal error config file: %w", err)
	}

	err = viper.Unmarshal(&config)
	return
}

func loadFromEnv() (Config, error) {
	// Check if required environment variables are set
	requiredEnvVars := []string{
		"KTRLPLANE_DB_HOST",
		"KTRLPLANE_DB_USER", 
		"KTRLPLANE_DB_PASSWORD",
		"KTRLPLANE_DB_NAME",
		"KTRLPLANE_AUTH_DOMAIN",
		"KTRLPLANE_AUTH_AUDIENCE",
	}

	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			return Config{}, fmt.Errorf("required environment variable %s is not set", envVar)
		}
	}

	// Parse database port
	dbPort := 5432 // default
	if portStr := os.Getenv("KTRLPLANE_DB_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			dbPort = p
		}
	}

	// Build config from environment variables
	config := Config{
		Server: ServerConfig{
			Port: getEnvWithDefault("KTRLPLANE_SERVER_PORT", "3001"),
		},
		Database: DatabaseConfig{
			Host:      os.Getenv("KTRLPLANE_DB_HOST"),
			Port:      dbPort,
			User:      os.Getenv("KTRLPLANE_DB_USER"),
			Password:  os.Getenv("KTRLPLANE_DB_PASSWORD"),
			DBName:    os.Getenv("KTRLPLANE_DB_NAME"),
			SSLMode:   getEnvWithDefault("KTRLPLANE_DB_SSL_MODE", "disable"),
		},
		Auth0: Auth0Config{
			Domain:   os.Getenv("KTRLPLANE_AUTH_DOMAIN"),
			Audience: os.Getenv("KTRLPLANE_AUTH_AUDIENCE"),
		},
		Stripe: StripeConfig{
			SecretKey:      getEnvWithDefault("STRIPE_SECRET_KEY", ""),
			PublishableKey: getEnvWithDefault("STRIPE_PUBLISHABLE_KEY", ""),
			WebhookSecret:  getEnvWithDefault("STRIPE_WEBHOOK_SECRET", ""),
		},
	}

	return config, nil
}

func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
