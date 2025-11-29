import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import {
  User,
  Role,
  RoleAssignment,
  AccessControlContextType,
} from "../types/access.types";
import { handleApiError } from "@/lib/errorHandler";

// Fetch roles
export function useRoles() {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Role[]>("/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
  });
}

// Fetch permissions for a specific role (cached per roleId)
export function useRolePermissions(roleId: string | null) {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["rolePermissions", roleId],
    queryFn: async () => {
      if (!roleId) return [];
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get(`/roles/${roleId}/permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    enabled: !!roleId,
  });
}

// Fetch role assignments for a context
export function useRoleAssignments(context: AccessControlContextType | null) {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["roleAssignments", context],
    queryFn: async () => {
      if (!context) return [];
      let url = "";
      switch (context.scopeType) {
        case "organization":
          url = `/organizations/${context.scopeId}/rbac`;
          break;
        case "project":
          url = `/projects/${context.scopeId}/rbac`;
          break;
        case "resource": {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/projects\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac`;
          break;
        }
      }
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<RoleAssignment[]>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    enabled: !!context,
  });
}

// Fetch users (search)
export function useSearchUsers(query: string) {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<User[]>(
          `/users/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    enabled: !!query && query.length >= 2,
  });
}

// Invite user
export function useInviteUser(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();
  return useMutation({
    mutationFn: async ({
      userId,
      roleName,
    }: {
      userId: string;
      roleName: string;
    }) => {
      if (!context) throw new Error("Missing context");
      let url = "";
      switch (context.scopeType) {
        case "organization":
          url = `/organizations/${context.scopeId}/rbac`;
          break;
        case "project":
          url = `/projects/${context.scopeId}/rbac`;
          break;
        case "resource": {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/projects\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac`;
          break;
        }
      }
      try {
        const token = await getAccessTokenSilently();
        await apiClient.post(
          url,
          {
            user_id: userId,
            role_id: roleName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAssignments", context] });
    },
  });
}

// Update user role
export function useUpdateUserRole(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      roleName,
    }: {
      assignmentId: string;
      roleName: string;
    }) => {
      if (!context) throw new Error("Missing context");
      let url = "";
      switch (context.scopeType) {
        case "organization":
          url = `/organizations/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case "project":
          url = `/projects/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case "resource": {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/projects\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac/${assignmentId}`;
          break;
        }
      }
      try {
        const token = await getAccessTokenSilently();
        await apiClient.put(
          url,
          { role_id: roleName },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAssignments", context] });
    },
  });
}

// Remove user
export function useRemoveUser(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!context) throw new Error("Missing context");
      let url = "";
      switch (context.scopeType) {
        case "organization":
          url = `/organizations/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case "project":
          url = `/projects/${context.scopeId}/rbac/${assignmentId}`;
          break;
        case "resource": {
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/projects\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac/${assignmentId}`;
          break;
        }
      }
      try {
        const token = await getAccessTokenSilently();
        await apiClient.delete(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAssignments", context] });
    },
  });
}

// Fetch user permissions
export function useUserPermissions(
  scopeType: "organization" | "project" | "resource",
  scopeId: string
) {
  const { getAccessTokenSilently } = useAuth0();
  return useQuery({
    queryKey: ["userPermissions", scopeType, scopeId],
    queryFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get("/permissions/check", {
          params: { scopeType, scopeId },
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.permissions || [];
      } catch (err: unknown) {
        await handleApiError(err);
      }
    },
    enabled: !!scopeType && !!scopeId,
  });
}
