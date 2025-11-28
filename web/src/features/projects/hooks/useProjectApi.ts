import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "../types/project.types";

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
        return response.data;
      } catch (err: any) {
        if (
          err?.error === "login_required" ||
          err?.error === "consent_required"
        ) {
          await loginWithRedirect();
        }
        throw err;
      }
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
        return response.data;
      } catch (err: any) {
        if (
          err?.error === "login_required" ||
          err?.error === "consent_required"
        ) {
          await loginWithRedirect();
        }
        throw err;
      }
    },
    enabled: !!projectId,
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
        return response.data;
      } catch (err: any) {
        if (
          err?.error === "login_required" ||
          err?.error === "consent_required"
        ) {
          await loginWithRedirect();
        }
        throw err;
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
        return response.data;
      } catch (err: any) {
        if (
          err?.error === "login_required" ||
          err?.error === "consent_required"
        ) {
          await loginWithRedirect();
        }
        throw err;
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
      } catch (err: any) {
        if (
          err?.error === "login_required" ||
          err?.error === "consent_required"
        ) {
          await loginWithRedirect();
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
