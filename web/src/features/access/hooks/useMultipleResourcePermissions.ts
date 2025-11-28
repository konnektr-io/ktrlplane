import { useUserPermissions as useUserPermissionsQuery } from "./useAccessApi";

export function useMultipleResourcePermissions(resourceIds: string[]) {
  // For each resourceId, call the React Query hook
  const permissionsMap: Record<string, string[]> = {};
  const loadingMap: Record<string, boolean> = {};
  const errorMap: Record<string, string | null> = {};

  resourceIds.forEach((id) => {
    const {
      data: perms = [],
      isLoading,
      error,
    } = useUserPermissionsQuery("resource", id);
    permissionsMap[id] = perms;
    loadingMap[id] = isLoading;
    errorMap[id] = error
      ? typeof error === "string"
        ? error
        : (error as Error).message
      : null;
  });

  return { permissionsMap, loadingMap, errorMap };
}
