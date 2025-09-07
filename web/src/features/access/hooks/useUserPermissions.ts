import { useEffect, useState } from "react";
import { fetchUserPermissions } from "../api/permissions";

export function useUserPermissions(
  scopeType: "organization" | "project",
  scopeId: string | undefined | null
) {
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scopeType || !scopeId) {
      setPermissions(null);
      return;
    }
    setLoading(true);
    fetchUserPermissions(scopeType, scopeId)
      .then((perms) => {
        setPermissions(perms);
        setError(null);
      })
      .catch((err) => {
        setPermissions([]);
        setError(err?.message || "Failed to fetch permissions");
      })
      .finally(() => setLoading(false));
  }, [scopeType, scopeId]);

  return { permissions, loading, error };
}
