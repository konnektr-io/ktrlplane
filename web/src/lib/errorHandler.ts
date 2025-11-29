export async function handleApiError(
  err: unknown,
  loginWithRedirect?: () => Promise<void>
) {
  if (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    ((err as { error?: string }).error === "login_required" ||
      (err as { error?: string }).error === "consent_required")
  ) {
    if (loginWithRedirect) await loginWithRedirect();
  }
  throw err;
}
