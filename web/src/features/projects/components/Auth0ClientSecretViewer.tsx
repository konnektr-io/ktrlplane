import { ProjectSecretViewer } from "./ProjectSecretViewer";

interface Auth0ClientSecretViewerProps {
  projectId: string;
}

/**
 * Displays the Auth0 M2M client credentials for a project.
 * The secret is automatically generated when the project is deployed
 * through the Auth0 operator in Kubernetes.
 */
export function Auth0ClientSecretViewer({
  projectId,
}: Auth0ClientSecretViewerProps) {
  // The Auth0 operator creates a secret named "auth0-client-{projectId}"
  const secretName = `auth0-client-${projectId}`;

  return (
    <ProjectSecretViewer
      projectId={projectId}
      secretName={secretName}
      title="Client Credentials"
      description="Machine-to-machine client credentials for API authentication"
    />
  );
}
