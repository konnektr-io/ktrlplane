import { create } from 'zustand';
import { AccessControlContextType } from "../types/access.types";

interface AccessStore {
  // Current context
  context: AccessControlContextType | null;
  // UI state only (selection, etc.)
  selectedUserId?: string;
  selectedRoleId?: string;
  setContext: (context: AccessControlContextType) => void;
  setSelectedUserId: (userId: string) => void;
  setSelectedRoleId: (roleId: string) => void;
}

export const useAccessStore = create<AccessStore>((set) => ({
  context: null,
  selectedUserId: undefined,
  selectedRoleId: undefined,
  setContext: (context) => set({ context }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  setSelectedRoleId: (roleId) => set({ selectedRoleId: roleId }),
}));
