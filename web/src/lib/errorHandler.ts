export async function handleApiError(
  err: unknown,
  loginWithRedirect?: () => Promise<void>
) {
  if (
    (typeof err === "object" &&
      err !== null &&
      "error" in err &&
      ["login_required", "consent_required", "missing_refresh_token"].includes(
        (err as { error?: string }).error || ""
      )) ||
    // Check for Axios 401
    (typeof err === "object" && err !== null && "response" in err && typeof (err as { response?: { status?: number } }).response?.status === "number" && (err as { response?: { status?: number } }).response?.status === 401)
  ) {
    if (loginWithRedirect) await loginWithRedirect();
  }
  throw err;
}
