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
    (err as any)?.response?.status === 401
  ) {
    if (loginWithRedirect) await loginWithRedirect();
  }
  throw err;
}
