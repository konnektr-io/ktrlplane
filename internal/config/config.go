package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds the application configuration.
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Auth     AuthConfig     `mapstructure:"auth"`
	Stripe   StripeConfig   `mapstructure:"stripe"`
}

// ServerConfig holds server-related configuration.
type ServerConfig struct {
	Port string `mapstructure:"port"`
}

// DatabaseConfig holds database-related configuration.
type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"dbname"`
	SSLMode  string `mapstructure:"sslmode"`
}

// AuthConfig holds authentication-related configuration.
type AuthConfig struct {
	Issuer   string `mapstructure:"issuer"`
	Audience string `mapstructure:"audience"`
}

// StripeConfig holds Stripe-related configuration.
type StripeConfig struct {
	SecretKey      string          `mapstructure:"secret_key"`
	PublishableKey string          `mapstructure:"publishable_key"`
	WebhookSecret  string          `mapstructure:"webhook_secret"`
	Products       []StripeProduct `mapstructure:"products"`
}

// StripeProduct represents a Stripe product configuration.
type StripeProduct struct {
	ResourceType string `mapstructure:"resource_type"`
	SKU          string `mapstructure:"sku"`
	ProductID    string `mapstructure:"product_id"`
}

// LoadConfig loads configuration from the given path.
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.SetEnvPrefix("ktrlplane")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Explicitly bind env vars to config keys
	viper.BindEnv("server.port")
	viper.BindEnv("database.host")
	viper.BindEnv("database.port")
	viper.BindEnv("database.user")
	viper.BindEnv("database.password")
	viper.BindEnv("database.dbname")
	viper.BindEnv("database.sslmode")
	viper.BindEnv("auth.issuer")
	viper.BindEnv("auth.audience")
	viper.BindEnv("stripe.secret_key")
	viper.BindEnv("stripe.publishable_key")
	viper.BindEnv("stripe.webhook_secret")

	err = viper.ReadInConfig()
	if err != nil {
		return Config{}, fmt.Errorf("fatal error config file: %w", err)
	}

	err = viper.Unmarshal(&config)
	return
}
