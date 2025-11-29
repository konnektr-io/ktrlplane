import { useQueries } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/errorHandler";

export function useMultipleResourcePermissions(resourceIds: string[]) {
  const { getAccessTokenSilently } = useAuth0();
  // For each resourceId, call the React Query hook
  // Use useQueries to fetch permissions for all resourceIds in parallel
  const results = useQueries({
    queries: resourceIds.map((id) => ({
      queryKey: ["userPermissions", "resource", id],
      queryFn: async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get("/permissions/check", {
            params: { scopeType: "resource", scopeId: id },
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.data.permissions || [];
        } catch (err: unknown) {
          await handleApiError(err);
        }
      },
      enabled: !!id,
    })),
  });

  const permissionsMap: Record<string, string[]> = {};
  const loadingMap: Record<string, boolean> = {};
  const errorMap: Record<string, string | null> = {};

  resourceIds.forEach((id: string, idx: number) => {
    const result = results[idx] as UseQueryResult<string[], unknown>;
    permissionsMap[id] = result.data || [];
    loadingMap[id] = result.isLoading;
    let errorMsg: string | null = null;
    if (result.error) {
      if (typeof result.error === "string") {
        errorMsg = result.error;
      } else if (result.error instanceof Error) {
        errorMsg = result.error.message;
      } else if (
        typeof result.error === "object" &&
        result.error !== null &&
        "message" in result.error
      ) {
        errorMsg = String((result.error as { message?: unknown }).message);
      } else {
        errorMsg = JSON.stringify(result.error);
      }
    }
    errorMap[id] = errorMsg;
  });

  return { permissionsMap, loadingMap, errorMap };
}
