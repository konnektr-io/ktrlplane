import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/errorHandler";
import type { BillingInfo } from "../types/billing.types";

// Fetch billing info for org or project
export function useBilling(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useQuery({
    queryKey: ["billing", scopeType, scopeId],
    queryFn: async () => {
      if (!scopeId) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get<BillingInfo>(
          `${baseURL}/billing`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!scopeId,
  });
}

// Setup Stripe customer (no longer requires email/name in request body - uses Auth0 user info)
export function useSetupStripeCustomer(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useMutation({
    mutationFn: async (data?: { description?: string }) => {
      try {
        const token = await getAccessTokenSilently();
        await apiClient.post(`${baseURL}/billing/customer`, data || {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}

// Open Stripe customer portal
export function useOpenCustomerPortal(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useMutation({
    mutationFn: async (return_url: string) => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.post(
          `${baseURL}/billing/portal`,
          { return_url },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data.portal_url;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}

// Create subscription
export function useCreateSubscription(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        await apiClient.post(
          `${baseURL}/billing/subscription`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}

// Cancel subscription
export function useCancelSubscription(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        await apiClient.post(
          `${baseURL}/billing/cancel`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}
// Get billing status for org or project (for onboarding/payment enforcement)
export function useBillingStatus(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useQuery({
    queryKey: ["billing-status", scopeType, scopeId],
    queryFn: async () => {
      if (!scopeId) return null;
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.get(`${baseURL}/billing/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
    enabled: !!scopeId,
  });
}

// Create Stripe SetupIntent for payment onboarding (Stripe Elements)
export function useCreateSetupIntent(
  scopeType: "organization" | "project",
  scopeId: string
) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const baseURL =
    scopeType === "organization"
      ? `/organizations/${scopeId}`
      : `/projects/${scopeId}`;
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await apiClient.post(
          `${baseURL}/billing/setup-intent`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data.client_secret;
      } catch (err: unknown) {
        await handleApiError(err, loginWithRedirect);
      }
    },
  });
}
