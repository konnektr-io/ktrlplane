import { useEffect, useState } from "react";
import { fetchUserPermissions } from "../api/permissions";

export function useMultipleResourcePermissions(resourceIds: string[]) {
  const [permissionsMap, setPermissionsMap] = useState<
    Record<string, string[]>
  >({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!resourceIds || resourceIds.length === 0) {
      setPermissionsMap({});
      setLoadingMap({});
      setErrorMap({});
      return;
    }

    // Only set loading for new resourceIds
    setLoadingMap((prev) => {
      const next = { ...prev };
      resourceIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    let cancelled = false;
    const fetchAll = async () => {
      const perms: Record<string, string[]> = {};
      const loading: Record<string, boolean> = {};
      const errors: Record<string, string | null> = {};
      for (const id of resourceIds) {
        try {
          const p = await fetchUserPermissions("resource", id);
          perms[id] = p;
          errors[id] = null;
        } catch (err: any) {
          perms[id] = [];
          errors[id] = err?.message || "Failed to fetch permissions";
        }
        loading[id] = false;
      }
      if (!cancelled) {
        setPermissionsMap(perms);
        setLoadingMap(loading);
        setErrorMap(errors);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(resourceIds)]);

  return { permissionsMap, loadingMap, errorMap };
}
