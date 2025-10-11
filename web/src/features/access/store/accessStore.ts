import { create } from 'zustand';
import { User, Role, RoleAssignment, AccessControlContextType } from '../types';
import apiClient from '../../../lib/axios';

interface AccessStore {
  // Current context
  context: AccessControlContextType | null;
  
  // Data
  users: User[];
  roles: Role[];
  roleAssignments: RoleAssignment[];
  
  // Loading states
  isLoading: boolean;
  isInviting: boolean;
  isUpdating: boolean;
  
  // Actions
  setContext: (context: AccessControlContextType) => void;
  fetchRoleAssignments: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  inviteUser: (userId: string, roleName: string) => Promise<void>;
  updateUserRole: (assignmentId: string, roleName: string) => Promise<void>;
  removeUser: (assignmentId: string) => Promise<void>;
  
  // Utilities
  getRoleByName: (name: string) => Role | undefined;
  getUserAssignments: (userId: string) => RoleAssignment[];
  hasPermission: (action: string) => boolean;
}

export const useAccessStore = create<AccessStore>((set, get) => ({
  // Initial state
  context: null,
  users: [],
  roles: [],
  roleAssignments: [],
  isLoading: false,
  isInviting: false,
  isUpdating: false,

  // Actions
  setContext: (context) => {
    set({ context });
    // Fetch data when context changes
    get().fetchRoleAssignments();
    get().fetchRoles();
  },

  fetchRoleAssignments: async () => {
    const { context } = get();
    if (!context) return;

    set({ isLoading: true });
    try {
      let url = '';
      switch (context.scopeType) {
        case "organization":
          url = `/organizations/${context.scopeId}/rbac`;
          break;
        case "project":
          url = `/projects/${context.scopeId}/rbac`;
          break;
        case "resource": {
          // For resources, we need to extract the project ID from the current path
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/project\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac`;
          break;
        }
      }

      const response = await apiClient.get(url);
      
      // Process the response to include populated user and role data
      const assignments = response.data.map((assignment: RoleAssignment) => ({
        ...assignment,
        created_at: assignment.created_at,
        expires_at: assignment.expires_at,
      }));

      set({ roleAssignments: assignments });
    } catch (error) {
      console.error('Failed to fetch role assignments:', error);
      // Show empty state instead of mock data to indicate backend is not available
      set({ roleAssignments: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoles: async () => {
    try {
      // Try to fetch roles from the backend
      const response = await apiClient.get('/roles');
      set({ roles: response.data });
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      // Fall back to mock data
      const mockRoles: Role[] = [
        {
          role_id: 'role1',
          name: 'Owner',
          display_name: 'Owner',
          description: 'Full access to all resources and settings',
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          role_id: 'role2',
          name: 'Editor',
          display_name: 'Editor',
          description: 'Can create, edit, and delete resources',
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          role_id: 'role3',
          name: 'Viewer',
          display_name: 'Viewer',
          description: 'Read-only access to resources',
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      set({ roles: mockRoles });
    }
  },

  searchUsers: async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    try {
      // Try to search users in the backend
      const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
      // Map user_id to id for compatibility with UserSelector
      return response.data;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  },

  inviteUser: async (userId: string, roleName: string) => {
    const { context } = get();
    if (!context) return;

    set({ isInviting: true });
    try {
      let url = '';
      switch (context.scopeType) {
        case 'organization':
          url = `/organizations/${context.scopeId}/rbac`;
          break;
        case 'project':
          url = `/projects/${context.scopeId}/rbac`;
          break;
        case 'resource': {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/project\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : '';
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac`;
          break;
        }
      }

        await apiClient.post(url, {
          user_id: userId,
          role_name: roleName,
        });
      
      // Refresh data after successful invite
      await get().fetchRoleAssignments();
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    } finally {
      set({ isInviting: false });
    }
  },

  updateUserRole: async (assignmentId: string, roleName: string) => {
    const { context } = get();
    if (!context) return;

    set({ isUpdating: true });
    try {
      let url = '';
      switch (context.scopeType) {
        case 'organization':
          url = `/organizations/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case 'project':
          url = `/projects/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case 'resource': {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/project\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : '';
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac/${assignmentId}`;
          break;
        }
      }

      await apiClient.put(url, {
        role_name: roleName,
      });
      
      // Refresh data after successful update
      await get().fetchRoleAssignments();
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  removeUser: async (assignmentId: string) => {
    const { context } = get();
    if (!context) return;

    set({ isUpdating: true });
    try {
      let url = '';
      switch (context.scopeType) {
        case 'organization':
          url = `/organizations/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case 'project':
          url = `/projects/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case 'resource': {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/project\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : '';
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac/${assignmentId}`;
          break;
        }
      }

      await apiClient.delete(url);
      
      // Refresh data after successful removal
      await get().fetchRoleAssignments();
    } catch (error) {
      console.error('Failed to remove user:', error);
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Utilities
  getRoleByName: (name) => {
    return get().roles.find(role => role.name === name);
  },

  getUserAssignments: (userId) => {
    return get().roleAssignments.filter(assignment => assignment.user_id === userId);
  },

  hasPermission: () => {
    // Mock permission check - replace with actual implementation
    // This would check the current user's permissions in the current context
    return true;
  },
}));
