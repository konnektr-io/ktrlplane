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
  return useMutation({
    mutationFn: async (data: CreateResourceData) => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.post<Resource>(
          `/projects/${projectId}/resources`,
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
