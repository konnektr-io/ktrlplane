import { create } from 'zustand';
import { User, Role, RoleAssignment, AccessControlContextType } from '../types';

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
  inviteUser: (email: string, roleName: string, expiresAt?: string) => Promise<void>;
  updateUserRole: (assignmentId: string, roleName: string, expiresAt?: string) => Promise<void>;
  removeUser: (assignmentId: string) => Promise<void>;
  
  // Utilities
  getRoleByName: (name: string) => Role | undefined;
  getUserAssignments: (userId: string) => RoleAssignment[];
  hasPermission: (action: string) => boolean; // Check current user's permissions
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
    // Auto-fetch data when context changes
    get().fetchRoleAssignments();
    get().fetchRoles();
  },

  fetchRoleAssignments: async () => {
    const { context } = get();
    if (!context) return;

    set({ isLoading: true });
    try {
      // Mock data for now - replace with actual API call
      const mockAssignments: RoleAssignment[] = [
        {
          assignment_id: '1',
          user_id: 'user1',
          role_id: 'role1',
          scope_type: context.scopeType,
          scope_id: context.scopeId,
          assigned_by: 'admin',
          created_at: new Date().toISOString(),
          user: {
            id: 'user1',
            email: 'john.doe@example.com',
            name: 'John Doe',
          },
          role: {
            role_id: 'role1',
            name: 'Owner',
            display_name: 'Owner',
            description: 'Full access to all resources',
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          assignment_id: '2',
          user_id: 'user2',
          role_id: 'role2',
          scope_type: context.scopeType,
          scope_id: context.scopeId,
          assigned_by: 'admin',
          created_at: new Date().toISOString(),
          user: {
            id: 'user2',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
          },
          role: {
            role_id: 'role2',
            name: 'Editor',
            display_name: 'Editor',
            description: 'Can edit and manage resources',
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          assignment_id: '3',
          user_id: 'user3',
          role_id: 'role3',
          scope_type: context.scopeType,
          scope_id: context.scopeId,
          assigned_by: 'admin',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          user: {
            id: 'user3',
            email: 'bob.wilson@example.com',
            name: 'Bob Wilson',
          },
          role: {
            role_id: 'role3',
            name: 'Viewer',
            display_name: 'Viewer',
            description: 'Read-only access to resources',
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];

      set({ roleAssignments: mockAssignments });
    } catch (error) {
      console.error('Failed to fetch role assignments:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoles: async () => {
    try {
      // Mock data for now - replace with actual API call
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
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  },

  inviteUser: async (email, roleName, expiresAt) => {
    const { context } = get();
    if (!context) return;

    set({ isInviting: true });
    try {
      // Mock API call - replace with actual implementation
      console.log('Inviting user:', { email, roleName, expiresAt, context });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data after successful invite
      await get().fetchRoleAssignments();
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    } finally {
      set({ isInviting: false });
    }
  },

  updateUserRole: async (assignmentId, roleName, expiresAt) => {
    set({ isUpdating: true });
    try {
      // Mock API call - replace with actual implementation
      console.log('Updating user role:', { assignmentId, roleName, expiresAt });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data after successful update
      await get().fetchRoleAssignments();
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  removeUser: async (assignmentId) => {
    set({ isUpdating: true });
    try {
      // Mock API call - replace with actual implementation
      console.log('Removing user:', { assignmentId });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

  hasPermission: (_action) => {
    // Mock permission check - replace with actual implementation
    // This would check the current user's permissions in the current context
    return true;
  },
}));
