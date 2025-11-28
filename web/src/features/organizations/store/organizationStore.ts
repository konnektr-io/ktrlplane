import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '../types/organization.types';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import axios from 'axios';

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  fetchOrganizations: (
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<void>;
  fetchOrganizationById: (
    orgId: string,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<void>;
  setCurrentOrganization: (org: Organization | null) => void;
  updateOrganization: (
    orgId: string,
    data: Partial<Organization>,
    getAccessTokenSilently: () => Promise<string>,
    loginWithRedirect: () => Promise<void>
  ) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      updateOrganization: async (
        orgId,
        data,
        getAccessTokenSilently,
        loginWithRedirect
      ) => {
        set({ isLoading: true, error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.put<Organization>(
            `/organizations/${orgId}`,
            data,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updatedOrg = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set({ currentOrganization: updatedOrg, isLoading: false });
          toast.success("Organization updated");
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
            : "Failed to update organization";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoading: false });
        }
      },
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,

      fetchOrganizations: async (getAccessTokenSilently, loginWithRedirect) => {
        set({ isLoading: true, error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get<Organization[]>(
            "/organizations",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const organizationsWithDates = response.data.map(
            (org: Organization) => ({
              ...org,
              created_at: new Date(org.created_at),
              updated_at: new Date(org.updated_at),
            })
          );
          set({ organizations: organizationsWithDates, isLoading: false });
          // Auto-select the first organization if none is selected
          if (!get().currentOrganization && organizationsWithDates.length > 0) {
            set({ currentOrganization: organizationsWithDates[0] });
          }
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
            : "Failed to fetch organizations";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoading: false });
        }
      },

      fetchOrganizationById: async (
        orgId,
        getAccessTokenSilently,
        loginWithRedirect
      ) => {
        set({ isLoading: true, error: null });
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get<Organization>(
            `/organizations/${orgId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const orgWithDates = {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at),
          };
          set({ currentOrganization: orgWithDates, isLoading: false });
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
            : "Failed to fetch organization";
          toast.error(errorMsg);
          set({ error: errorMsg, isLoading: false });
        }
      },

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
