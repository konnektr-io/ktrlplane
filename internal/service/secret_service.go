package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// SecretService handles Kubernetes secret operations.
type SecretService struct {
	clientset   *kubernetes.Clientset
	rbacService *RBACService
}

// NewSecretService creates a new SecretService with Kubernetes client.
func NewSecretService() (*SecretService, error) {
	config, err := getKubernetesConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubernetes config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	return &SecretService{
		clientset:   clientset,
		rbacService: NewRBACService(),
	}, nil
}

// getKubernetesConfig returns the Kubernetes configuration.
// It first tries in-cluster config, then falls back to kubeconfig file.
func getKubernetesConfig() (*rest.Config, error) {
	// Try in-cluster config first (when running inside Kubernetes)
	config, err := rest.InClusterConfig()
	if err == nil {
		return config, nil
	}

	// Fall back to kubeconfig file (for local development)
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get home directory: %w", err)
		}
		kubeconfigPath = filepath.Join(homeDir, ".kube", "config")
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	return config, nil
}

// SecretData represents the base64-encoded secret data.
// Data values are returned as base64 strings and should be decoded in the frontend.
type SecretData struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Data      map[string]string `json:"data"` // base64-encoded values
	Type      string            `json:"type"`
}

// GetProjectSecret retrieves a secret from a project's namespace.
// The namespace is expected to match the project ID (as per the design).
// This method checks RBAC permissions before retrieving the secret.
// Secret values are returned base64-encoded and should be decoded in the frontend.
func (s *SecretService) GetProjectSecret(ctx context.Context, projectID, secretName, userID string) (*SecretData, error) {
	// Check if user has read permission on the project
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to access project secrets")
	}

	// Project ID is the namespace name
	namespace := projectID

	// Retrieve the secret from Kubernetes
	secret, err := s.clientset.CoreV1().Secrets(namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve secret '%s' from namespace '%s': %w", secretName, namespace, err)
	}

	// Keep secret data base64-encoded (convert byte arrays to base64 strings)
	encodedData := make(map[string]string)
	for key, value := range secret.Data {
		encodedData[key] = base64.StdEncoding.EncodeToString(value)
	}

	// StringData (if present) needs to be encoded to base64 as well
	for key, value := range secret.StringData {
		encodedData[key] = base64.StdEncoding.EncodeToString([]byte(value))
	}

	return &SecretData{
		Name:      secret.Name,
		Namespace: secret.Namespace,
		Data:      encodedData,
		Type:      string(secret.Type),
	}, nil
}
