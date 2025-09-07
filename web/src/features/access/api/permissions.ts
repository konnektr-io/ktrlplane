import apiClient from "@/lib/axios";

export async function fetchUserPermissions(
  scopeType: "organization" | "project" | "resource",
  scopeId: string
): Promise<string[]> {
  const response = await apiClient.get("/permissions/check", {
    params: { scopeType, scopeId },
  });
  return response.data.permissions || [];
}
