import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "../types/project.types";

interface ProjectUIState {
  currentProject: Project | null;
  lastProjectId: string | null;
  setCurrentProject: (project: Project | null) => void;
  setLastProjectId: (projectId: string | null) => void;
}

export const useProjectStore = create<ProjectUIState>()(
  persist(
    (set) => ({
      currentProject: null,
      lastProjectId: null,
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
