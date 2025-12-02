# Secret Management Components - Usage Guide

## Overview

This guide demonstrates how to use the secret management components to display Kubernetes secrets in your React components.

## Components

### 1. ProjectSecretViewer (Generic)

A reusable component for displaying any Kubernetes secret with show/hide and copy functionality.

```tsx
import { ProjectSecretViewer } from "@/features/projects/components/ProjectSecretViewer";

function MyComponent() {
  return (
    <ProjectSecretViewer
      projectId="my-project-id"
      secretName="my-custom-secret"
      title="Custom Credentials"
      description="Service account credentials"
    />
  );
}
```

### 2. Auth0ClientSecretViewer (Specific)

A specialized component for displaying Auth0 M2M client credentials.

```tsx
import { Auth0ClientSecretViewer } from "@/features/projects/components/Auth0ClientSecretViewer";

function ProjectDetailsPage({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <h2>API Authentication</h2>
      <Auth0ClientSecretViewer projectId={projectId} />
    </div>
  );
}
```

## API Hook

### useProjectSecret

For advanced use cases where you need direct access to secret data:

```tsx
import { useProjectSecret, decodeSecretValue } from "@/features/projects/hooks/useProjectSecret";

function CustomSecretComponent({ projectId, secretName }: Props) {
  const { data: secret, isLoading, error } = useProjectSecret(projectId, secretName);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading secret</div>;

  // Access base64-encoded data
  const clientId = secret?.data["client-id"];
  
  // Decode when needed
  const decodedClientId = clientId ? decodeSecretValue(clientId) : "";

  return <div>{decodedClientId}</div>;
}
```

## Security Features

1. **Base64 Encoding**: All secret values are transmitted base64-encoded from the backend
2. **Client-side Decoding**: Values are decoded only in the frontend when displayed
3. **Show/Hide Toggle**: Users can toggle visibility of sensitive values
4. **Copy to Clipboard**: Secure copy functionality with visual feedback
5. **RBAC Enforcement**: Backend checks project read permissions before returning secrets
6. **No Caching**: Secrets are not cached in React Query for security

## Backend Integration

The components integrate with the KtrlPlane API:

- **Endpoint**: `GET /api/v1/projects/{projectId}/secrets/{secretName}`
- **Authentication**: Requires Auth0 JWT token
- **Authorization**: User must have `read` permission on the project
- **Response Format**:
  ```json
  {
    "name": "my-project-auth0-client",
    "namespace": "my-project",
    "data": {
      "client-id": "base64encodedvalue",
      "client-secret": "base64encodedvalue"
    },
    "type": "Opaque"
  }
  ```

## Example: Adding to Project Settings Page

```tsx
// In web/src/features/projects/pages/ProjectSettingsPage.tsx

import { Auth0ClientSecretViewer } from "@/features/projects/components/Auth0ClientSecretViewer";
import { useParams } from "react-router-dom";

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1>Project Settings</h1>
      
      {/* Other settings sections */}
      
      <section>
        <h2>API Credentials</h2>
        <Auth0ClientSecretViewer projectId={projectId!} />
      </section>
    </div>
  );
}
```

## Future Enhancements

When `Konnektr.Secret` resource type is implemented:

- Secret creation UI
- Secret versioning
- Audit logging of secret access
- More granular RBAC at secret level
- Secret rotation workflows
