import { create } from 'zustand';
import { AccessControlContextType } from "../types/access.types";

interface AccessStore {
  // Current context
  context: AccessControlContextType | null;
  setContext: (context: AccessControlContextType) => void;
}

export const useAccessStore = create<AccessStore>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));
