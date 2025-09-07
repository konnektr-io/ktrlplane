package main

import (
	"context"
	"ktrlplane/internal/api"
	"ktrlplane/internal/auth" // Import auth package
	"ktrlplane/internal/config"
	"ktrlplane/internal/db"
	"ktrlplane/internal/service"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/stripe/stripe-go/v82"
)

func main() {
	// --- Configuration ---
	cfg, err := config.LoadConfig(".") // Load config from current directory
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// --- Database Initialization ---
	if err := db.InitDB(cfg.Database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.CloseDB()

	// --- Authentication Setup ---
	// Pass Auth0 config to the auth package
	if err := auth.SetupAuth(cfg.Auth0.Audience, cfg.Auth0.Domain); err != nil {
		log.Fatalf("Failed to set up authentication: %v", err)
	}

	// --- Stripe Setup ---
	if cfg.Stripe.SecretKey != "" {
		stripe.Key = cfg.Stripe.SecretKey
		log.Println("Stripe initialized successfully")
	} else {
		log.Println("Warning: Stripe secret key not configured. Billing features will not work.")
	}

	// --- Service Initialization ---
	projectService := service.NewProjectService()
	resourceService := service.NewResourceService()
	organizationService := service.NewOrganizationService()
	rbacService := service.NewRBACService()
	billingService := service.NewBillingService(db.GetDB(), &cfg)

	// --- API Handler Initialization ---
	apiHandler := api.NewAPIHandler(projectService, resourceService, organizationService, rbacService, billingService)

	// --- Router Setup ---
	router := api.SetupRouter(apiHandler)

	// --- Server Initialization ---
	serverAddr := "127.0.0.1:" + cfg.Server.Port
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: router,
		// Add other server configurations like timeouts
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// --- Graceful Shutdown Setup ---
	go func() {
		log.Printf("Starting server on %s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe(): %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be caught
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the requests it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
