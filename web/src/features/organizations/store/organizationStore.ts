import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from "../types/organization.types";

interface OrganizationUIState {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationUIState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      setCurrentOrganization: (org: Organization | null) => {
        set({ currentOrganization: org });
      },
    }),
    {
      name: "organization-storage",
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);
