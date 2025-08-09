import { create } from 'zustand';
import { Resource, CreateResourceData, UpdateResourceData } from '@/lib/types';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import axios from 'axios';

interface ResourceState {
  resources: Resource[];
  currentResource: Resource | null; // For detail view
  isLoading: boolean;
  error: string | null;
  fetchResources: (projectId: string) => Promise<void>;
  fetchResourceById: (projectId: string, resourceId: string) => Promise<void>;
  createResource: (projectId: string, data: CreateResourceData) => Promise<Resource | null>;
  updateResource: (projectId: string, resourceId: string, data: UpdateResourceData) => Promise<Resource | null>;
  deleteResource: (projectId: string, resourceId: string) => Promise<boolean>;
  setCurrentResource: (resource: Resource | null) => void;
  clearResources: () => void; // Clear when changing projects
}

// Helper to parse resource dates
const parseResourceDates = (resource: Resource): Resource => ({
    ...resource,
    created_at: new Date(resource.created_at),
    updated_at: new Date(resource.updated_at),
     // Ensure helm_values is an object after potential string fetch
    helm_values: typeof resource.helm_values === 'string' ? JSON.parse(resource.helm_values || '{}') : (resource.helm_values ?? {}),
});


export const useResourceStore = create<ResourceState>((set) => ({
  resources: [],
  currentResource: null,
  isLoading: false,
  error: null,

  clearResources: () => set({ resources: [], currentResource: null, isLoading: false, error: null }),

  fetchResources: async (projectId) => {
    if (!projectId) return;
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Resource[]>(`/projects/${projectId}/resources`);
      const resourcesWithDates = response.data.map(parseResourceDates);
      set({ resources: resourcesWithDates, isLoading: false });
    } catch (err: unknown) {
        const errorMsg = axios.isAxiosError(err)
            ? err.response?.data?.error || err.message
            : (err instanceof Error ? err.message : 'Failed to fetch resources');
        toast.error(errorMsg);
        set({ error: errorMsg, isLoading: false, resources: [] });
    }
  },

  fetchResourceById: async (projectId, resourceId) => {
      if (!projectId || !resourceId) return;
       set({ isLoading: true, error: null });
      try {
          const response = await apiClient.get<Resource>(`/projects/${projectId}/resources/${resourceId}`);
          const resourceWithDates = parseResourceDates(response.data);
          set({ currentResource: resourceWithDates, isLoading: false });
      } catch (err: unknown) {
           const errorMsg = axios.isAxiosError(err)
               ? err.response?.data?.error || err.message
               : (err instanceof Error ? err.message : `Failed to fetch resource ${resourceId}`);
           toast.error(errorMsg);
           set({ error: errorMsg, isLoading: false, currentResource: null });
      }
  },

  createResource: async (projectId, data) => {
     if (!projectId) return null;
      set({ error: null });
      try {
          const payload = {
                ...data,
                helm_values: typeof data.helm_values === 'object' ? JSON.stringify(data.helm_values) : data.helm_values,
            };
          const response = await apiClient.post<Resource>(`/projects/${projectId}/resources`, payload);
          const newResource = parseResourceDates(response.data);
          set((state) => ({ resources: [...state.resources, newResource] }));
          toast.success(`Resource "${newResource.name}" created successfully.`);
          return newResource;
      } catch (err: unknown) {
          const errorMsg = axios.isAxiosError(err)
              ? err.response?.data?.error || err.message
              : (err instanceof Error ? err.message : 'Failed to create resource');
          toast.error(errorMsg);
          set({ error: errorMsg });
          return null;
      }
  },

  updateResource: async (projectId, resourceId, data) => {
    if (!projectId || !resourceId) return null;
    set({ error: null });
     try {
         const payload = { ...data };
         if (typeof payload.helm_values === 'object') {
            payload.helm_values = JSON.stringify(payload.helm_values);
         }

         const response = await apiClient.put<Resource>(`/projects/${projectId}/resources/${resourceId}`, payload);
         const updatedResource = parseResourceDates(response.data);
         set((state) => ({
             resources: state.resources.map((r) => (r.resource_id === resourceId ? updatedResource : r)),
             currentResource: state.currentResource?.resource_id === resourceId ? updatedResource : state.currentResource,
         }));
         toast.success(`Resource "${updatedResource.name}" updated.`);
         return updatedResource;
     } catch (err: unknown) {
         const errorMsg = axios.isAxiosError(err)
             ? err.response?.data?.error || err.message
             : (err instanceof Error ? err.message : 'Failed to update resource');
         toast.error(errorMsg);
         set({ error: errorMsg });
         return null;
     }
  },

   deleteResource: async (projectId, resourceId): Promise<boolean> => {
       if (!projectId || !resourceId) return false;
       set({ error: null });
       try {
           await apiClient.delete(`/projects/${projectId}/resources/${resourceId}`);
           set((state) => ({
               resources: state.resources.filter((r) => r.resource_id !== resourceId),
               currentResource: state.currentResource?.resource_id === resourceId ? null : state.currentResource,
           }));
           toast.success(`Resource deletion initiated.`);
           return true;
       } catch (err: unknown) {
           const errorMsg = axios.isAxiosError(err)
               ? err.response?.data?.error || err.message
               : (err instanceof Error ? err.message : 'Failed to delete resource');
           toast.error(errorMsg);
           set({ error: errorMsg });
           return false;
       }
   },


  setCurrentResource: (resource) => {
    set({ currentResource: resource });
  },
}));