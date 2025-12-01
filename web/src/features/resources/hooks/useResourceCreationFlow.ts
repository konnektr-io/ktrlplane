import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ResourceType } from "../schemas";
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
  resourceType: ResourceType | "";
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
  billingStatus?: { hasPaymentMethod: boolean };
  billingLoading: boolean;
  isGlobalRoute: boolean;
}

export function useResourceCreationFlow({
  urlProjectId,
  hasProjects,
  billingStatus,
  billingLoading,
  isGlobalRoute,
}: UseResourceCreationFlowParams) {
  const [searchParams] = useSearchParams();

  // Parse URL parameters
  const preselectedResourceType = searchParams.get(
    "resourceType"
  ) as ResourceType | null;
  const preselectedSku = searchParams.get("tier") || searchParams.get("sku");
  const preselectedProjectId = searchParams.get("projectId");

  // Initialize state from URL params
  const [state, setState] = useState<ResourceCreationState>({
    projectId: urlProjectId || preselectedProjectId || null,
    resourceType: preselectedResourceType || "",
    resourceName: "",
    resourceId: "",
    sku: preselectedSku || "free",
    skipSettings: false,
    skipAccess: true, // Default to skipping access step
  });

  // Current step index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Calculate steps based on context
  const steps = useMemo<StepConfig[]>(() => {
    const calculatedSteps: StepConfig[] = [];

    // Step 1: Project selection/creation (only on global route without project context)
    if (isGlobalRoute && !urlProjectId) {
      calculatedSteps.push({
        id: "project",
        label: hasProjects ? "Select Project" : "Create Project",
        required: true,
        visible: true,
      });
    }

    // Step 2: Resource type selection (skip if preselected)
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

    // Step 4: Billing setup (only if paid and no payment method)
    const isPaid = isPaidResource(state.resourceType, state.sku);
    if (
      isPaid &&
      billingStatus &&
      !billingStatus.hasPaymentMethod &&
      !billingLoading
    ) {
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
      selectedResourceType.settingsReady &&
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
    isGlobalRoute,
    urlProjectId,
    hasProjects,
    preselectedResourceType,
    state.resourceType,
    state.sku,
    state.skipSettings,
    state.skipAccess,
    billingStatus,
    billingLoading,
  ]);

  // Get current step
  const currentStep = steps[currentStepIndex];

  // Auto-select SKU if preselected from URL
  useEffect(() => {
    if (preselectedResourceType && preselectedSku) {
      const catalogType = catalogResourceTypes.find(
        (rt) => rt.id === preselectedResourceType
      );
      if (catalogType?.skus.some((s) => s.sku === preselectedSku)) {
        setState((prev) => ({ ...prev, sku: preselectedSku }));
      }
    }
  }, [preselectedResourceType, preselectedSku]);

  // Navigation helpers
  const canGoNext = () => {
    if (!currentStep) return false;

    switch (currentStep.id) {
      case "project":
        return !!state.projectId;
      case "resourceType":
        return !!state.resourceType;
      case "tier":
        return (
          !!state.resourceName.trim() &&
          !!state.resourceId.trim() &&
          !!state.sku
        );
      case "billing":
        return billingStatus?.hasPaymentMethod || false;
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
  };
}
