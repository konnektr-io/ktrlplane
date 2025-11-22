package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds the application configuration.
type Config struct {
	Server      ServerConfig      `mapstructure:"server"`
	Database    DatabaseConfig    `mapstructure:"database"`
	Auth        AuthConfig        `mapstructure:"auth"`
	Stripe      StripeConfig      `mapstructure:"stripe"`
	Observability ObservabilityConfig `mapstructure:"observability"`
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
	// WebhookSecret  string          `mapstructure:"webhook_secret"`
	Products       []StripeProduct `mapstructure:"products"`
}

// StripeProduct represents a Stripe product configuration.
type StripeProduct struct {
	ResourceType string `mapstructure:"resource_type"`
	SKU          string `mapstructure:"sku"`
	ProductID    string `mapstructure:"product_id"`
}

// ObservabilityConfig holds observability backend configuration.
type ObservabilityConfig struct {
	Loki  LokiConfig  `mapstructure:"loki"`
	Mimir MimirConfig `mapstructure:"mimir"`
}

// LokiConfig holds Loki (logging) backend configuration.
type LokiConfig struct {
	URL     string `mapstructure:"url"`
	Enabled bool   `mapstructure:"enabled"`
}

// MimirConfig holds Mimir (metrics) backend configuration.
type MimirConfig struct {
	URL     string `mapstructure:"url"`
	Enabled bool   `mapstructure:"enabled"`
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

       // Bind environment variables and check for errors
       envVars := []string{
	       "server.port",
	       "database.host",
	       "database.port",
	       "database.user",
	       "database.password",
	       "database.dbname",
	       "database.sslmode",
	       "auth.issuer",
	       "auth.audience",
	       "stripe.secret_key",
	       "stripe.publishable_key",
	    //    "stripe.webhook_secret",
	       "observability.loki.url",
	       "observability.loki.enabled",
	       "observability.mimir.url",
	       "observability.mimir.enabled",
       }
       for _, key := range envVars {
	       if err := viper.BindEnv(key); err != nil {
		       return Config{}, fmt.Errorf("failed to bind env var %s: %w", key, err)
	       }
       }

	err = viper.ReadInConfig()
	if err != nil {
		return Config{}, fmt.Errorf("fatal error config file: %w", err)
	}

	err = viper.Unmarshal(&config)
	return
}
