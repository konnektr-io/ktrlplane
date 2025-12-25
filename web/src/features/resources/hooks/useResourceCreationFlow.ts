import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ResourceType } from "../catalog/resourceTypes";
import { resourceTypes as catalogResourceTypes } from "../catalog/resourceTypes";
import { isPaidResource } from "@/features/billing/utils/isPaidResource";

export type ResourceCreationStep =
  | "project"
  | "resourceType"
  | "tier"
  | "billing"
  | "settings"
  | "access"
  | "review";

export interface StepConfig {
  id: ResourceCreationStep;
  label: string;
  required: boolean;
  visible: boolean;
}

export interface ResourceCreationState {
  projectId: string | null;
  resourceType: ResourceType['id'] | "";
  resourceName: string;
  resourceId: string;
  sku: string;
  settings?: Record<string, unknown>;
  skipSettings: boolean;
  skipAccess: boolean;
}

interface UseResourceCreationFlowParams {
  urlProjectId?: string;
  hasProjects: boolean;
  billingStatus?: {
    hasPaymentMethod: boolean;
    hasStripeCustomer?: boolean;
    hasActiveSubscription?: boolean;
  };
  billingLoading: boolean;
  // isGlobalRoute: boolean;
}

export function useResourceCreationFlow({
  urlProjectId,
  billingStatus,
  billingLoading,
}: // isGlobalRoute,
UseResourceCreationFlowParams) {
  const [searchParams] = useSearchParams();

  // Parse URL parameters
  const urlResourceType =
    searchParams.get("resourceType") || searchParams.get("resource_type");
  const preselectedResourceType = urlResourceType as ResourceType["id"] | null;
  const preselectedSku = searchParams.get("tier") || searchParams.get("sku");
  const preselectedProjectId = searchParams.get("projectId");

  // Initialize state from URL params
  const [state, setState] = useState<ResourceCreationState>({
    projectId: urlProjectId || preselectedProjectId || null,
    resourceType: preselectedResourceType || "",
    resourceName: "",
    resourceId: "",
    sku: preselectedSku || "",
    skipSettings: false,
    skipAccess: true, // Default to skipping access step
  });

  // Current step index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Calculate steps based on context
  const steps = useMemo<StepConfig[]>(() => {
    const calculatedSteps: StepConfig[] = [];

    // Step 1: Resource type selection (skip only if explicitly preselected via URL)
    if (!preselectedResourceType) {
      calculatedSteps.push({
        id: "resourceType",
        label: "Select Resource Type",
        required: true,
        visible: true,
      });
    }

    // Step 3: Tier selection (always show - includes name, ID, and tier)
    calculatedSteps.push({
      id: "tier",
      label: "Configure Resource",
      required: true,
      visible: true,
    });

    // Step 4: Billing setup (only if paid and billing not fully set up)
    const isPaid = isPaidResource(state.resourceType, state.sku);
    const needsBillingSetup =
      isPaid &&
      billingStatus &&
      !billingLoading &&
      // Need billing setup if: no customer, no payment method, or no active subscription
      (!billingStatus.hasStripeCustomer ||
        !billingStatus.hasPaymentMethod ||
        !billingStatus.hasActiveSubscription);

    if (needsBillingSetup && state.resourceType !== "Konnektr.Secret") {
      calculatedSteps.push({
        id: "billing",
        label: "Setup Billing",
        required: true,
        visible: true,
      });
    }

    // Step 5: Settings configuration (only if resource has settings and they're ready)
    const selectedResourceType = catalogResourceTypes.find(
      (rt) => rt.id === state.resourceType
    );
    if (
      selectedResourceType &&
      selectedResourceType.hasSettings &&
      !state.skipSettings
    ) {
      calculatedSteps.push({
        id: "settings",
        label: "Configure Settings",
        required: selectedResourceType.requiresSettings || false,
        visible: true,
      });
    }

    // Step 6: Access control (optional - show if not skipped)
    if (!state.skipAccess) {
      calculatedSteps.push({
        id: "access",
        label: "Grant Access",
        required: false,
        visible: true,
      });
    }

    return calculatedSteps;
  }, [
    preselectedResourceType,
    state.resourceType,
    state.sku,
    billingStatus,
    billingLoading,
    state.skipSettings,
    state.skipAccess,
  ]);

  // Get current step
  const currentStep = steps[currentStepIndex];

  // Effect: If steps change and currentStepIndex points to a step that no longer exists, reset to last valid step
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(steps.length - 1);
    } else if (steps.length > 0 && !steps[currentStepIndex]) {
      setCurrentStepIndex(0);
    }
    // If the current step is 'billing' but billing is now set up, advance to next step
    if (
      steps.length > 0 &&
      steps[currentStepIndex]?.id === "billing" &&
      !(
        billingStatus &&
        !billingLoading &&
        (!billingStatus.hasStripeCustomer ||
          !billingStatus.hasPaymentMethod ||
          !billingStatus.hasActiveSubscription)
      )
    ) {
      // Find the next step after billing
      const billingIdx = steps.findIndex((s) => s.id === "billing");
      if (billingIdx !== -1 && billingIdx < steps.length - 1) {
        setCurrentStepIndex(billingIdx + 1);
      } else if (billingIdx !== -1 && billingIdx === steps.length - 1) {
        setCurrentStepIndex(steps.length - 1);
      }
    }
  }, [steps, currentStepIndex, billingStatus, billingLoading]);

  // Helper: validate whether a sku belongs to a resource type
  const isSkuValidForType = (type: ResourceType["id"] | "", sku: string) => {
    if (!type) return false;
    const t = catalogResourceTypes.find((rt) => rt.id === type);
    // If type has no SKUs (like Secret), then an empty SKU is valid
    if (t && t.skus.length === 0) return true;
    if (!sku) return false;
    return !!t?.skus.some((s) => s.sku === sku);
  };

  // Auto-select/normalize SKU if preselected from URL - only on initial load
  useEffect(() => {
    if (preselectedResourceType) {
      const catalogType = catalogResourceTypes.find(
        (rt) => rt.id === preselectedResourceType
      );
      if (catalogType) {
        if (
          preselectedSku &&
          catalogType.skus.some((s) => s.sku === preselectedSku)
        ) {
          // Valid preselected sku - only set if not already set by user
          setState((prev) => {
            if (prev.sku === "" || prev.sku === preselectedSku) {
              return { ...prev, sku: preselectedSku };
            }
            return prev;
          });
        } else if (!state.sku) {
          // Fallback to first available SKU only if no SKU is set
          const fallbackSku = catalogType.skus[0]?.sku || "";
          setState((prev) => ({ ...prev, sku: fallbackSku }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedResourceType, preselectedSku]);

  // Navigation helpers
  const canGoNext = () => {
    if (!currentStep) return false;

    switch (currentStep.id) {
      case "resourceType":
        return !!state.resourceType;
      case "tier":
        return (
          !!state.resourceName.trim() &&
          !!state.resourceId.trim() &&
          // SKU is required only if the type has SKUs
          isSkuValidForType(state.resourceType, state.sku)
        );
      case "billing":
        // Can proceed from billing step when customer, payment method, and subscription are setup
        return (
          (billingStatus?.hasStripeCustomer ?? false) &&
          (billingStatus?.hasPaymentMethod ?? false)
        );
      case "settings":
        return !currentStep.required || !!state.settings;
      case "access":
        return true; // Always optional
      default:
        return true;
    }
  };

  const canGoBack = () => currentStepIndex > 0;

  const goNext = () => {
    if (canGoNext() && currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (canGoBack()) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const goToStep = (stepId: ResourceCreationStep) => {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  };

  const skipCurrentStep = () => {
    if (currentStep && !currentStep.required) {
      if (currentStep.id === "settings") {
        setState((prev) => ({ ...prev, skipSettings: true }));
      } else if (currentStep.id === "access") {
        setState((prev) => ({ ...prev, skipAccess: true }));
      }
      goNext();
    }
  };

  const getNextStepLabel = () => {
    const nextStep = steps[currentStepIndex + 1];
    return nextStep ? nextStep.label : "Create Resource";
  };

  const getPreviousStepLabel = () => {
    const prevStep = steps[currentStepIndex - 1];
    return prevStep ? prevStep.label : "Back";
  };

  const isLastStep = () => currentStepIndex === steps.length - 1;

  const updateState = (updates: Partial<ResourceCreationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Ensure sku remains valid when resource type changes
  useEffect(() => {
    if (!isSkuValidForType(state.resourceType, state.sku)) {
      const t = catalogResourceTypes.find((rt) => rt.id === state.resourceType);
      if (t) {
        const fallbackSku = t.skus[0]?.sku;
        setState((prev) => ({ ...prev, sku: fallbackSku }));
      }
    }
  }, [state.resourceType, state.sku]);

  return {
    state,
    setState: updateState,
    steps,
    currentStep,
    currentStepIndex,
    canGoNext: canGoNext(),
    canGoBack: canGoBack(),
    goNext,
    goBack,
    goToStep,
    skipCurrentStep,
    getNextStepLabel,
    getPreviousStepLabel,
    isLastStep: isLastStep(),
    preselectedResourceType,
    preselectedSku,
    isSkuValidForType,
  };
}
