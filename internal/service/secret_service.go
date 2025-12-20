package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	corev1 "k8s.io/api/core/v1"
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

// CreateProjectSecret creates a new secret in the project namespace.
func (s *SecretService) CreateProjectSecret(ctx context.Context, projectID string, data SecretData, userID string) (*SecretData, error) {
	// Check if user has write permission on the project
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to create project secrets")
	}

	namespace := projectID

	// Prepare data map (decoding from request if necessary, or assuming request sends plain text? 
	// Usually frontend sends plain text values when creating, but SecretData struct says "base64-encoded values". 
	// Let's assume the Service takes plain text values in a DTO or handles decoding if the input is base64. 
	// However, standard K8s input for StringData is plain text.
	// Users API input might vary. Let's look at frontend.
	// Frontend `SecretForm` sends `data: Record<string, string>`. 
	// `Data` in `SecretData` is `map[string]string`. 
	// Let's assume input `data.Data` contains PLAIN TEXT values for creation usage simplicity, 
	// OR we can add a flag. 
	// Standard practice: Input DTO often differs from Output DTO.
	// But `SecretData` is shared. 
	// IF the frontend sends plain text, we should put it into `StringData`.
	
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      data.Name,
			Namespace: namespace,
            Labels: map[string]string{
                "konnektr.io/managed-by": "ktrlplane",
            },
		},
		Type: corev1.SecretType(data.Type),
		StringData: data.Data, // Use StringData for auto-encoding
	}

    // If type is empty, default to Opaque
    if secret.Type == "" {
        secret.Type = corev1.SecretTypeOpaque
    }

	createdSecret, err := s.clientset.CoreV1().Secrets(namespace).Create(ctx, secret, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create secret: %w", err)
	}

	// Helper to reconstruct response (similar to Get)
    // We return what we created.
	encodedData := make(map[string]string)
	for key, value := range createdSecret.Data {
		encodedData[key] = base64.StdEncoding.EncodeToString(value)
	}
    // StringData might not be populated in the response from Create, but Data will be (encoded).

	return &SecretData{
		Name:      createdSecret.Name,
		Namespace: createdSecret.Namespace,
		Data:      encodedData,
		Type:      string(createdSecret.Type),
	}, nil
}

// UpdateProjectSecret updates an existing secret in the project namespace.
func (s *SecretService) UpdateProjectSecret(ctx context.Context, projectID string, secretName string, data SecretData, userID string) (*SecretData, error) {
	// Check if user has write permission on the project
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to update project secrets")
	}

	namespace := projectID

	// Get existing secret to ensure it exists and preserve any metadata if needed
	existingSecret, err := s.clientset.CoreV1().Secrets(namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve secret for update: %w", err)
	}

	// Update encoded data
	// data.Data contains plain text strings (assumed from frontend input), so we put them in StringData.
	// existingSecret.Data (byte arrays) will be overwritten by K8s when StringData is processed.
	// We need to clear existing Data if we want to fully replace, OR we just update fields.
	// Usually PUT implies full replacement of the data map.
	
	// Reset Data to ensure we don't have stale keys if the user removed them
	existingSecret.Data = nil 
	existingSecret.StringData = data.Data

    // We can also update type if provided, though changing type of existing secret is rare/risky.
    if data.Type != "" {
        existingSecret.Type = corev1.SecretType(data.Type)
    }

	updatedSecret, err := s.clientset.CoreV1().Secrets(namespace).Update(ctx, existingSecret, metav1.UpdateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to update secret: %w", err)
	}

	// Helper to reconstruct response
	encodedData := make(map[string]string)
	for key, value := range updatedSecret.Data {
		encodedData[key] = base64.StdEncoding.EncodeToString(value)
	}

	return &SecretData{
		Name:      updatedSecret.Name,
		Namespace: updatedSecret.Namespace,
		Data:      encodedData,
		Type:      string(updatedSecret.Type),
	}, nil
}
