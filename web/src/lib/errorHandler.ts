export async function handleApiError(
  err: unknown,
  loginWithRedirect?: () => Promise<void>
) {
  if (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    ["login_required", "consent_required", "missing_refresh_token"].includes(
      (err as { error?: string }).error || ""
    )
  ) {
    if (loginWithRedirect) await loginWithRedirect();
  }
  throw err;
}
