# Deployment Guide

This guide covers production deployment of ktrlplane.

## Installation Methods

### Helm Chart (Recommended)

The easiest way to deploy ktrlplane in production:

```bash
# Add Helm repository
helm repo add konnektr https://charts.konnektr.io
helm repo update

# Install with custom values
helm install ktrlplane konnektr/ktrlplane -f values.yaml
```

### Example values.yaml

```yaml
image:
  backend:
    repository: ghcr.io/konnektr-io/ktrlplane-backend
    tag: "latest"
  frontend:
    repository: ghcr.io/konnektr-io/ktrlplane-frontend
    tag: "latest"

database:
  external: true
  host: "postgres.example.com"
  port: 5432
  name: "ktrlplane_production"

auth0:
  domain: "your-domain.auth0.com"
  audience: "https://api.ktrlplane.example.com"

ingress:
  enabled: true
  hostname: "ktrlplane.example.com"
  tls: true
```

## Configuration

### Environment Variables

| Variable         | Description        | Required |
| ---------------- | ------------------ | -------- |
| `DB_HOST`        | Database host      | Yes      |
| `DB_PORT`        | Database port      | Yes      |
| `DB_NAME`        | Database name      | Yes      |
| `DB_USER`        | Database user      | Yes      |
| `DB_PASSWORD`    | Database password  | Yes      |
| `AUTH_DOMAIN`    | Auth domain        | Yes      |
| `AUTH_AUDIENCE`  | Auth audience      | Yes      |

### Database Setup

ktrlplane requires PostgreSQL 14+. For production:

1. Use a managed database service (AWS RDS, Google Cloud SQL, etc.)
2. Enable SSL connections
3. Set up automated backups
4. Configure connection pooling

### Authentication

ktrlplane uses Auth0 for authentication:

1. Create an Auth0 application
2. Configure allowed callback URLs
3. Set up API audience
4. Configure RBAC in Auth0

## Security Considerations

### Network Security

- Use TLS termination at load balancer
- Restrict database access to application pods
- Use network policies in Kubernetes

### Secrets Management

- Store secrets in Kubernetes secrets or external secret management
- Rotate database credentials regularly
- Use least-privilege access

### Monitoring

Recommended monitoring setup:

- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack or similar
- **Tracing**: Jaeger (if needed)
- **Health Checks**: Built-in endpoints

## Scaling

### Horizontal Scaling

- Backend: Scale based on CPU/memory usage
- Frontend: Scale based on traffic
- Database: Use read replicas for read-heavy workloads

### Performance Tuning

- Enable database connection pooling
- Configure appropriate resource limits
- Use CDN for static assets
- Implement caching strategies

## Backup and Recovery

### Database Backups

- Daily automated backups
- Point-in-time recovery
- Test restore procedures regularly

### Disaster Recovery

- Multi-region deployment for high availability
- Database replication across regions
- Regular disaster recovery testing

## Troubleshooting

### Common Issues

**Pod crashes on startup**

- Check configuration values
- Verify database connectivity
- Review application logs

**Authentication failures**

- Verify Auth0 configuration
- Check JWT token validation
- Validate callback URLs

**Database connection errors**

- Check network connectivity
- Verify credentials
- Check connection limits

### Getting Help

- Check application logs: `kubectl logs -f deployment/ktrlplane-backend`
- Review metrics in monitoring dashboard
- Consult [troubleshooting guide](troubleshooting.md)
