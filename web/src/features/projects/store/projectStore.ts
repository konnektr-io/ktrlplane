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
  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (
    projectId: string,
    data: Partial<{ name: string; description: string }>
  ) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
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

      fetchProjects: async () => {
        set({ isLoadingList: true, error: null });
        try {
          const response = await apiClient.get<Project[]>("/projects");
          const projectsWithDates = response.data.map((p: any) => ({
            ...p,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
          }));
          set({ projects: projectsWithDates, isLoadingList: false });
        } catch (err: unknown) {
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to fetch projects";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoadingList: false });
        }
      },

      fetchProjectById: async (projectId: string) => {
        set({ isLoadingDetail: true, error: null });
        try {
          const response = await apiClient.get<Project>(
            `/projects/${projectId}`
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
          const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : err instanceof Error
            ? err.message
            : "Failed to fetch project details";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoadingDetail: false });
        }
      },

      createProject: async (data): Promise<Project | null> => {
        set({ error: null });
        try {
          const response = await apiClient.post<Project>("/projects", data);
          const newProject = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set((state) => ({ projects: [...state.projects, newProject] }));
          toast.success(`Project "${newProject.name}" created successfully.`);
          return newProject;
        } catch (err: unknown) {
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

      updateProject: async (projectId, data) => {
        set({ error: null });
        try {
          const response = await apiClient.put<Project>(
            `/projects/${projectId}`,
            data
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

      deleteProject: async (projectId: string): Promise<boolean> => {
        set({ error: null });
        try {
          await apiClient.delete(`/projects/${projectId}`);
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
