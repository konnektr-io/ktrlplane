import { useQuery } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/errorHandler";

// Secret data type (base64-encoded values)
export interface SecretData {
  name: string;
  namespace: string;
  data: Record<string, string>; // base64-encoded values
  type: string;
}

// Fetch a specific secret from a project
export function useProjectSecret(projectId: string, secretName: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  
  return useQuery({
    queryKey: ["project-secret", projectId, secretName],
    queryFn: async () => {
      if (!projectId || !secretName) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<SecretData>(
          `/projects/${projectId}/secrets/${secretName}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!projectId && !!secretName,
    // Don't cache secrets in query cache for security
    gcTime: 0,
    staleTime: 0,
  });
}

// Utility function to decode base64 secret values
export function decodeSecretValue(base64Value: string): string {
  try {
    return atob(base64Value);
  } catch (error) {
    console.error("Failed to decode secret value:", error);
    return "";
  }
}
