package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Auth     AuthConfig    `mapstructure:"auth"`
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

type AuthConfig struct {
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
       viper.AddConfigPath(path)
       viper.SetConfigName("config")
       viper.SetConfigType("yaml")
       viper.SetEnvPrefix("KTRLPLANE")
       viper.AutomaticEnv()

       err = viper.ReadInConfig()
       if err != nil {
	       return Config{}, fmt.Errorf("fatal error config file: %w", err)
       }

       err = viper.Unmarshal(&config)
       return
}