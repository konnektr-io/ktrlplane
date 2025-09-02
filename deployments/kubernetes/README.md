# Kubernetes Deployment Examples

Example Kubernetes manifests for testing and development.

## Files

- `manifests.yaml` - Complete Kubernetes deployment
- `deploy.sh` - Automated deployment script

## Usage

### Automated Deployment

```bash
./deploy.sh
```

### Manual Deployment

```bash
kubectl apply -f manifests.yaml
```

## What's Included

- Namespace (`ktrlplane`)
- PostgreSQL with persistent storage
- Backend deployment (2 replicas)
- Frontend deployment (2 replicas)
- Services and ingress
- ConfigMap for configuration

## Configuration

1. Update the ConfigMap in `manifests.yaml`:

   - Database connection details
   - Auth0 configuration

2. Update ingress hostname if needed

3. Ensure you have an ingress controller installed

## Access

Add to your hosts file:

```
<ingress-ip> ktrlplane.local
```

Then access: http://ktrlplane.local

## Production Considerations

This is a simplified example. For production:

- Use external database
- Implement proper secrets management
- Configure monitoring and logging
- Use official Helm chart
