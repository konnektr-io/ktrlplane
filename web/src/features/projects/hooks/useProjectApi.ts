import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "../types/project.types";
import { handleApiError } from "@/lib/errorHandler";
import { transformDates } from "@/lib/transformers";

// Fetch all projects for the current user/org
export function useProjects() {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Project[]>(`/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.map(transformDates<Project>);
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry specifically on 401s
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

// Fetch a single project by ID
export function useProject(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Project>(
          `/projects/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return transformDates<Project>(response.data);
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

// Create a project
export function useCreateProject() {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.post<Project>(`/projects`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return transformDates<Project>(response.data);
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Update a project
export function useUpdateProject(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.put<Project>(
          `/projects/${projectId}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return transformDates<Project>(response.data);
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

// Delete a project
export function useDeleteProject(projectId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Missing projectId");
      try {
        const token = await getAccessTokenSilently();
        await apiClient.delete(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
