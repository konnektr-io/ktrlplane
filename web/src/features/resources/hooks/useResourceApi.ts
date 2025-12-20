import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import {
  Resource,
  CreateResourceData,
  UpdateResourceData,
} from "../types/resource.types";
import { handleApiError } from "@/lib/errorHandler";
import { transformDates } from "@/lib/transformers";
import { useCreateSecret } from "@/features/projects/hooks/useProjectSecret";

// Fetch all resources for a project
export function useResources(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["resources", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Resource[]>(
          `/projects/${projectId}/resources`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data.map((r) => ({
          ...transformDates<Resource>(r),
          settings_json:
            typeof r.settings_json === "string"
              ? JSON.parse(r.settings_json || "{}")
              : r.settings_json ?? {},
        }));
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!projectId,
  });
}

// Fetch a single resource by ID
export function useResource(projectId: string, resourceId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["resource", projectId, resourceId],
    queryFn: async () => {
      if (!projectId || !resourceId) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Resource>(
          `/projects/${projectId}/resources/${resourceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const r = response.data;
        return {
          ...transformDates<Resource>(r),
          settings_json:
            typeof r.settings_json === "string"
              ? JSON.parse(r.settings_json || "{}")
              : r.settings_json ?? {},
        };
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!projectId && !!resourceId,
  });
}

// Create a resource
export function useCreateResource(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  const { mutateAsync: createSecret } = useCreateSecret(projectId); // Hook for secret creation

  return useMutation({
    mutationFn: async (data: CreateResourceData) => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        
        // 1. Create the resource metadata in database
        // For secrets, we might want to sanitize settings_json before saving to DB to avoid saving secret data there
        // But for now, we assume the backend handles it or we pass it as is and the backend ignores it for the DB
        // Actually, better to send empty settings for Secret resource creation to DB if we handle it separately?
        // Let's pass it, assuming backend might need metadata. But CRITICAL: verify backend doesn't log it.
        // SAFE APPROACH: If type is Secret, remove data from settings_json before sending to resource API
        
        let payload = { ...data, settings_json: data.settings_json ?? {} };
        
        if (data.type === 'Konnektr.Secret' && payload.settings_json) {
           // We keep the structure but maybe empty the data? 
           // For this implementation, we will act as if the backend resource creation is metadata only
           // and we rely on the createSecret call below for the actual content.
           // However, to be safe, we might clone and removing sensitive data for the DB call
           const safeSettings = { ...payload.settings_json };
           if ('data' in safeSettings) {
             delete safeSettings.data; // Don't save secret values to Resource DB table
           }
           payload.settings_json = safeSettings;
        }

        const response = await apiClient.post<Resource>(
          `/projects/${projectId}/resources`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // 2. If it's a Secret, create the Kubernetes secret
        if (data.type === 'Konnektr.Secret' && data.settings_json) {
           // Type casting for safety
           const secretSettings = data.settings_json as { secretType: string; data: Record<string, string> };
           if (secretSettings.data) {
             await createSecret({
               name: data.id,
               type: secretSettings.secretType || 'generic',
               data: secretSettings.data
             });
           }
        }

        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
    },
  });
}

// Update a resource
export function useUpdateResource(projectId: string, resourceId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateResourceData) => {
      if (!projectId || !resourceId)
        throw new Error("Missing projectId or resourceId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.put<Resource>(
          `/projects/${projectId}/resources/${resourceId}`,
          { ...data, settings_json: data.settings_json ?? {} },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["resource", projectId, resourceId],
      });
    },
  });
}

// Delete a resource
export function useDeleteResource(projectId: string, resourceId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!projectId || !resourceId)
        throw new Error("Missing projectId or resourceId");
      try {
        const token = await getAccessTokenSilently();
        await apiClient.delete(
          `/projects/${projectId}/resources/${resourceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
    },
  });
}
