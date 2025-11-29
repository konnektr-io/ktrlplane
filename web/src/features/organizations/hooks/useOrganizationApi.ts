import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import type { Organization } from "../types/organization.types";
import { handleApiError } from "@/lib/errorHandler";

// Fetch all organizations
export function useOrganizations() {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Organization[]>("/organizations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.map((org) => ({
          ...org,
          created_at: new Date(org.created_at),
          updated_at: new Date(org.updated_at),
        }));
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}

// Fetch a single organization by ID
export function useOrganization(orgId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<Organization>(
          `/organizations/${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const org = response.data;
        return {
          ...org,
          created_at: new Date(org.created_at),
          updated_at: new Date(org.updated_at),
        };
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!orgId,
  });
}

// Update an organization
export function useUpdateOrganization(orgId: string) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      if (!orgId) throw new Error("Missing orgId");
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.put<Organization>(
          `/organizations/${orgId}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return {
          ...response.data,
          created_at: new Date(response.data.created_at),
          updated_at: new Date(response.data.updated_at),
        };
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
    },
  });
}
