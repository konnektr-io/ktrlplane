package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Auth0    Auth0Config    `mapstructure:"auth0"`
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
	GraphPath string `mapstructure:"graphpath"`
	SSLMode   string `mapstructure:"sslmode"`
}

type Auth0Config struct {
	Domain   string `mapstructure:"domain"`
	Audience string `mapstructure:"audience"`
	ClientID string `mapstructure:"client_id"`
}

func LoadConfig(path string) (config Config, err error) {
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
