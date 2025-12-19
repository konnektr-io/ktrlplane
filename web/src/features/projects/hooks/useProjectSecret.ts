import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export interface CreateSecretData {
  name: string;
  type: string;
  data: Record<string, string>;
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

// Create a new secret
export function useCreateSecret(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSecretData) => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.post<SecretData>(
          `/projects/${projectId}/secrets`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      // Invalidate secret queries if needed, though usually we fetch by specific name
      // queryClient.invalidateQueries({ queryKey: ["project-secrets", projectId] });
    },
  });
}

export type UpdateSecretData = CreateSecretData;

// Update an existing secret
export function useUpdateSecret(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSecretData) => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.put<SecretData>(
          `/projects/${projectId}/secrets/${data.name}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific secret query so it refetches
      queryClient.invalidateQueries({ queryKey: ["project-secret", projectId, variables.name] });
    },
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
