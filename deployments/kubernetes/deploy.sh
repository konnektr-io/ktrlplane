#!/bin/bash

# Build and push Docker images
echo "Building backend image..."
docker build -f deployments/docker/Dockerfile.backend -t ktrlplane/backend:latest .

echo "Building frontend image..."
docker build -f deployments/docker/Dockerfile.frontend -t ktrlplane/frontend:latest .

# If using a registry, push images
# docker push ktrlplane/backend:latest
# docker push ktrlplane/frontend:latest

echo "Applying Kubernetes manifests..."
kubectl apply -f deployments/kubernetes/manifests.yaml

echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ktrlplane --timeout=300s
kubectl wait --for=condition=ready pod -l app=ktrlplane-backend -n ktrlplane --timeout=300s
kubectl wait --for=condition=ready pod -l app=ktrlplane-frontend -n ktrlplane --timeout=300s

echo "Getting service status..."
kubectl get all -n ktrlplane

echo "Setup complete! Add 'ktrlplane.local' to your /etc/hosts pointing to your ingress IP"
