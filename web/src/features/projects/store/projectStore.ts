import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project, CreateProjectData } from "../types/project.types";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import axios from "axios";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  lastProjectId: string | null;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  fetchProjects: (
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<void>;
  fetchProjectById: (
    projectId: string,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<void>;
  createProject: (
    data: CreateProjectData,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<Project | null>;
  updateProject: (
    projectId: string,
    data: Partial<{ name: string; description: string }>,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<Project | null>;
  deleteProject: (
    projectId: string,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
  setLastProjectId: (projectId: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      lastProjectId: null,
      isLoadingList: false,
      isLoadingDetail: false,
      error: null,

      fetchProjects: async (getAccessTokenSilently, loginWithRedirect) => {
        set({ isLoadingList: true, error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get<Project[]>("/projects", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const projectsWithDates = response.data.map((p: Project) => ({
            ...p,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
          }));
          set({ projects: projectsWithDates, isLoadingList: false });
        } catch (err: unknown) {
          const errorCode = (err as any)?.error;
          if (
            errorCode === "login_required" ||
            errorCode === "consent_required"
          ) {
            await loginWithRedirect();
            return;
          }
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to fetch projects";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoadingList: false });
        }
      },

      fetchProjectById: async (
        projectId,
        getAccessTokenSilently,
        loginWithRedirect
      ) => {
        set({ isLoadingDetail: true, error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get<Project>(
            `/projects/${projectId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const projectWithDates = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set({
            currentProject: projectWithDates,
            lastProjectId: projectId,
            isLoadingDetail: false,
          });
        } catch (err: unknown) {
          const errorCode = (err as any)?.error;
          if (
            errorCode === "login_required" ||
            errorCode === "consent_required"
          ) {
            await loginWithRedirect();
            return;
          }
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to fetch project details";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoadingDetail: false });
        }
      },

      createProject: async (
        data,
        getAccessTokenSilently,
        loginWithRedirect
      ): Promise<Project | null> => {
        set({ error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.post<Project>("/projects", data, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const newProject = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set((state) => ({ projects: [...state.projects, newProject] }));
          toast.success(`Project "${newProject.name}" created successfully.`);
          return newProject;
        } catch (err: unknown) {
          const errorCode = (err as any)?.error;
          if (
            errorCode === "login_required" ||
            errorCode === "consent_required"
          ) {
            await loginWithRedirect();
            return null;
          }
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to create project";
          toast.error(errorMsg);
          set({ error: errorMsg });
          return null;
        }
      },

      updateProject: async (
        projectId,
        data,
        getAccessTokenSilently,
        loginWithRedirect
      ) => {
        set({ error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.put<Project>(
            `/projects/${projectId}`,
            data,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const updatedProject = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set((state) => ({
            projects: state.projects.map((p) =>
              p.project_id === projectId ? updatedProject : p
            ),
            currentProject:
              state.currentProject?.project_id === projectId
                ? updatedProject
                : state.currentProject,
          }));
          toast.success(`Project "${updatedProject.name}" updated.`);
          return updatedProject;
        } catch (err: unknown) {
          const errorCode = (err as any)?.error;
          if (
            errorCode === "login_required" ||
            errorCode === "consent_required"
          ) {
            await loginWithRedirect();
            return null;
          }
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to update project";
          toast.error(errorMsg);
          set({ error: errorMsg });
          return null;
        }
      },

      deleteProject: async (
        projectId,
        getAccessTokenSilently,
        loginWithRedirect
      ): Promise<boolean> => {
        set({ error: null });
        try {
          const token = await getAccessTokenSilently();
          await apiClient.delete(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => ({
            projects: state.projects.filter((p) => p.project_id !== projectId),
            currentProject:
              state.currentProject?.project_id === projectId
                ? null
                : state.currentProject,
            lastProjectId:
              state.lastProjectId === projectId ? null : state.lastProjectId,
          }));
          toast.success(`Project deletion initiated.`);
          return true;
        } catch (err: unknown) {
          const errorCode = (err as any)?.error;
          if (
            errorCode === "login_required" ||
            errorCode === "consent_required"
          ) {
            await loginWithRedirect();
            return false;
          }
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to delete project";
          toast.error(errorMsg);
          set({ error: errorMsg });
          return false;
        }
      },

      setCurrentProject: (project: Project | null) => {
        set({
          currentProject: project,
          lastProjectId: project?.project_id || null,
        });
      },

      setLastProjectId: (projectId: string | null) => {
        set({ lastProjectId: projectId });
      },
    }),
    {
      name: "project-storage",
      partialize: (state) => ({
        lastProjectId: state.lastProjectId,
      }),
    }
  )
);
