// Analytics tracking utilities for KtrlPlane Portal

// Type definitions for global window analytics objects
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Track when user begins resource creation flow
export const trackResourceCreationStart = (
  resourceType: string,
  sku?: string,
  source?: string
) => {
  if (window.gtag) {
    window.gtag("event", "begin_resource_creation", {
      resource_type: resourceType,
      sku: sku || "unknown",
      source: source || "direct",
      event_category: "conversion_funnel",
    });
  }
};

// Track successful resource creation (conversion)
export const trackResourceCreation = (
  resourceType: string,
  sku: string,
  projectId: string
) => {
  if (window.gtag) {
    window.gtag("event", "resource_created", {
      resource_type: resourceType,
      tier: sku,
      project_id: projectId,
      event_category: "conversion",
      value: sku === "standard" ? 99 : 0,
      currency: "USD",
    });
  }
};

// Track project creation
export const trackProjectCreation = (
  projectId: string,
  projectName: string
) => {
  if (window.gtag) {
    window.gtag("event", "project_created", {
      project_id: projectId,
      project_name: projectName,
      event_category: "conversion",
    });
  }
};

// Track authentication events
export const trackAuthentication = (
  method: "sign_up" | "sign_in",
  provider?: string
) => {
  if (window.gtag) {
    window.gtag("event", method, {
      method: provider || "email",
      event_category: "authentication",
    });
  }
};
