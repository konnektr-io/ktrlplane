import { create } from "zustand";
import { Resource } from "../types/resource.types";

interface ResourceUIState {
  currentResource: Resource | null;
  setCurrentResource: (resource: Resource | null) => void;
  clearCurrentResource: () => void;
}

export const useResourceStore = create<ResourceUIState>((set) => ({
  currentResource: null,
  setCurrentResource: (resource) => set({ currentResource: resource }),
  clearCurrentResource: () => set({ currentResource: null }),
}));
