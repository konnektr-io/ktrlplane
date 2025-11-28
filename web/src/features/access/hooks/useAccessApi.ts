import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { User, Role, RoleAssignment, AccessControlContextType } from "../types";

// Fetch roles
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>("/roles");
      return response.data;
    },
  });
}

// Fetch role assignments for a context
export function useRoleAssignments(context: AccessControlContextType | null) {
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
          // For resources, extract projectId from route
          const currentPath = window.location.pathname;
          const projectMatch = currentPath.match(/\/projects\/([^/]+)/);
          const projectId = projectMatch ? projectMatch[1] : "";
          url = `/projects/${projectId}/resources/${context.scopeId}/rbac`;
          break;
        }
      }
      const response = await apiClient.get<RoleAssignment[]>(url);
      return response.data;
    },
    enabled: !!context,
  });
}

// Fetch users (search)
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await apiClient.get<User[]>(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    },
    enabled: !!query && query.length >= 2,
  });
}

// Invite user
export function useInviteUser(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
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
      await apiClient.post(url, {
        user_id: userId,
        role_id: roleName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAssignments", context] });
    },
  });
}

// Update user role
export function useUpdateUserRole(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
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
      await apiClient.put(url, { role_id: roleName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAssignments", context] });
    },
  });
}

// Remove user
export function useRemoveUser(context: AccessControlContextType | null) {
  const queryClient = useQueryClient();
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
      await apiClient.delete(url);
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
  return useQuery({
    queryKey: ["userPermissions", scopeType, scopeId],
    queryFn: async () => {
      const response = await apiClient.get("/permissions/check", {
        params: { scopeType, scopeId },
      });
      return response.data.permissions || [];
    },
    enabled: !!scopeType && !!scopeId,
  });
}
