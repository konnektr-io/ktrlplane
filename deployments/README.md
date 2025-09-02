# Deployment Examples

This directory contains example deployment configurations for ktrlplane. These are provided as reference implementations and starting points for your own deployments.

> **Note**: For production deployments, use the official Helm chart from our Helm repository.

## Directory Structure

- `docker/` - Docker and Docker Compose examples
- `kubernetes/` - Raw Kubernetes manifests examples

## Quick Start

### Docker Compose (Development)

```bash
cd deployments/docker
docker-compose up -d
```

### Kubernetes (Testing)

```bash
cd deployments/kubernetes
./deploy.sh
```

## Production Deployment

For production deployments, please use the official Helm chart:

```bash
helm repo add ktrlplane https://charts.ktrlplane.io
helm install ktrlplane ktrlplane/ktrlplane
```

See the [deployment documentation](../docs/deployment.md) for detailed instructions.
