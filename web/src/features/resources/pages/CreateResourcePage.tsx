import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  trackResourceCreationStart,
  trackResourceCreation,
  trackProjectCreation,
} from "@/utils/analytics";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateResource } from "../hooks/useResourceApi";
import { isPaidResource } from "@/features/billing/utils/isPaidResource";
import { useBillingStatus } from "@/features/billing/hooks/useBillingApi";
import { UnifiedBillingSetupModal } from "@/features/billing/components/BillingSetupModal";
import type { CreateResourceData } from "../types/resource.types";
import { defaultConfigurations } from "@/features/resources/schemas";
import { generateDNSId } from "@/lib/dnsUtils";
import { useProjects } from "@/features/projects/hooks/useProjectApi";
import { resourceTypes as catalogResourceTypes, ResourceType } from "@/features/resources/catalog/resourceTypes";
import { useResourceCreationFlow } from "../hooks/useResourceCreationFlow";
import {
  CreationProgressBar,
  ProjectSelectionStep,
  ResourceTypeStep,
  ConfigureResourceStep,
  BillingSetupStep,
  SettingsConfigurationStep,
  AccessControlStep,
} from "../components/creation";

export default function CreateResourcePage() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const navigate = useNavigate();
  // Get search params for UTM tracking
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // Determine if we're on the global create route
  const isGlobalCreateRoute = window.location.pathname === "/resources/create";

  // Billing status for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    urlProjectId || null
  );

  const {
    data: billingStatus,
    isLoading: billingLoading,
    refetch: refetchBillingStatus,
  } = useBillingStatus("project", selectedProjectId || "");

  // Pass typed billingStatus directly to flow
  const flow = useResourceCreationFlow({
    urlProjectId,
    hasProjects: projects.length > 0,
    billingStatus: billingStatus ?? {
      hasStripeCustomer: false,
      hasPaymentMethod: false,
      hasActiveSubscription: false,
      stripe_customer: undefined,
      payment_methods: [],
      subscription_details: null,
    },
    billingLoading,
    // isGlobalRoute: isGlobalCreateRoute,
  });

  // Track begin_resource_creation event on mount
  useEffect(() => {
    const resourceType =
      searchParams.get("resource_type") || flow.state.resourceType;
    const sku = searchParams.get("sku") || flow.state.sku;
    const utmSource =
      searchParams.get("utm_source") ||
      (document.referrer.includes("konnektr.io") ? "marketing" : "direct");
    if (resourceType) {
      trackResourceCreationStart(resourceType, sku, utmSource);
    }
  }, [flow.state.resourceType, flow.state.sku, searchParams]);

  // Sync selectedProjectId when projects are loaded (async data)
  // Also sync the flow state's projectId
  useEffect(() => {
    if (!urlProjectId && !selectedProjectId && projects.length > 0) {
      const firstProjectId = projects[0].project_id;
      setSelectedProjectId(firstProjectId);
    }
  }, [projects, urlProjectId, selectedProjectId]);

  // Keep flow state in sync with selectedProjectId
  useEffect(() => {
    if (selectedProjectId && flow.state.projectId !== selectedProjectId) {
      flow.setState({ projectId: selectedProjectId });
    }
  }, [selectedProjectId, flow]);

  // Update project ID when flow state changes
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    flow.setState({ projectId });
  };

  const handleUpdateSettings = (settings: unknown) => {
    // Defer state update to flow
    if (typeof settings === "object") {
      flow.setState({ settings: settings as Record<string, unknown> });
    }
  };

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
    flow.setState({ projectId });
    // Fire analytics event for project creation
    const createdProject = projects.find((p) => p.project_id === projectId);
    trackProjectCreation(projectId, createdProject?.name || "");
    flow.goNext();
  };

  // Resource type selection
  const handleResourceTypeSelect = (type: ResourceType["id"]) => {
    flow.setState({ resourceType: type });

    // Auto-select first available SKU for this resource type
    const catalogType = catalogResourceTypes.find((rt) => rt.id === type);
    if (catalogType && catalogType.skus.length > 0) {
      flow.setState({ sku: catalogType.skus[0].sku });
    }
  };

  // Name change handler with auto-ID generation
  const handleNameChange = (name: string) => {
    // Generate slug and only update ID if it changes significantly or if it's currently empty or the name changed
    // We want the ID to be stable once set, but still derived from name if name is edited for the first time
    const currentId = flow.state.resourceId;

    flow.setState({
      resourceName: name,
      resourceId:
        currentId &&
        currentId.startsWith(name.toLowerCase().replace(/[^a-z0-9]/g, "-"))
          ? currentId
          : generateDNSId(name),
    });
  };

  // Billing setup modal state
  const [showBillingSetupModal, setShowBillingSetupModal] = useState(false);

  // Resource creation
  const [isCreating, setIsCreating] = useState(false);
  const createResourceMutation = useCreateResource(selectedProjectId || "");

  const handleCreateResource = async (settings?: unknown) => {
    if (!selectedProjectId) {
      toast.error("Please select a project before creating a resource.");
      return;
    }
    setIsCreating(true);
    try {
      let settingsJson: Record<string, unknown> | undefined = undefined;
      if (settings && typeof settings === "object") {
        settingsJson = settings as Record<string, unknown>;
      }
      // Normalize/validate SKU before creating
      let sku = flow.state.sku;
      const type = flow.state.resourceType;
      const rt = catalogResourceTypes.find((r) => r.id === type);
      if (!sku || (rt && !rt.skus.some((s) => s.sku === sku))) {
        sku =
          rt?.skus.find((s) => s.sku === "free")?.sku ||
          rt?.skus[0]?.sku ||
          "free";
      }
      const payload: CreateResourceData = {
        id: flow.state.resourceId.trim(),
        name: flow.state.resourceName.trim(),
        type: flow.state.resourceType as ResourceType["id"],
        sku,
        settings_json: settingsJson,
      };
      const newResource = await createResourceMutation.mutateAsync(payload);
      if (newResource) {
        toast.success("Resource created successfully!");
        // Track resource_created event (conversion)
        trackResourceCreation(
          newResource.type,
          newResource.sku,
          newResource.project_id
        );

        // Navigation after success
        const from = searchParams.get("from");
        if (from === "secrets") {
          navigate(`/projects/${selectedProjectId}/secrets`);
        } else {
          navigate(
            `/projects/${selectedProjectId}/resources/${newResource.resource_id}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to create resource:", error);
      toast.error("Failed to create resource");
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected resource type details
  const selectedResourceType = catalogResourceTypes.find(
    (rt) => rt.id === flow.state.resourceType
  );
  const selectedTier = selectedResourceType?.skus.find(
    (s) => s.sku === flow.state.sku
  );

  // Check if current resource selection is paid
  const isPaid = isPaidResource(flow.state.resourceType, flow.state.sku);

  // Navigation handlers
  const handleBack = () => {
    if (flow.canGoBack) {
      flow.goBack();
    } else {
      // If can't go back, navigate away
      const from = searchParams.get("from");
      if (urlProjectId) {
        if (from === "secrets") {
          navigate(`/projects/${urlProjectId}/secrets`);
        } else {
          navigate(`/projects/${urlProjectId}/resources`);
        }
      } else {
        navigate("/projects");
      }
    }
  };

  const handleNext = () => {
    if (flow.currentStep.id === "tier") {
      // Check if billing is needed before proceeding
      if (isPaid && billingStatus && !billingStatus.hasPaymentMethod) {
        // Will show billing step next
        flow.goNext();
      } else {
        // Skip billing, check if settings are needed
        const needsSettings =
          selectedResourceType?.hasSettings &&
          selectedResourceType?.settingsReady &&
          !flow.state.skipSettings;

        if (needsSettings) {
          flow.goNext();
        } else {
          // Skip to final creation
          handleCreateResource();
        }
      }
    } else if (flow.isLastStep) {
      // Final step - create resource
      if (flow.currentStep.id === "settings") {
        // Settings are now managed via onChange, so we can proceed to creation
        handleCreateResource(flow.state.settings);
        return;
      } else if (flow.currentStep.id === "access") {
        // Skip access and create
        handleCreateResource();
      } else {
        handleCreateResource();
      }
    } else {
      flow.goNext();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Unified Billing Setup Modal */}
      <UnifiedBillingSetupModal
        open={showBillingSetupModal}
        onClose={() => setShowBillingSetupModal(false)}
        scopeType="project"
        scopeId={selectedProjectId || ""}
        onComplete={async () => {
          setShowBillingSetupModal(false);
          // Refetch billing status to get updated subscription info
          await refetchBillingStatus();
          // Flow will automatically proceed once billing status shows all requirements met
          flow.goNext();
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {flow.canGoBack ? `Back to ${flow.getPreviousStepLabel()}` : "Back"}
          </Button>
        </div>
        <h1 className="text-2xl font-bold">
          {flow.preselectedResourceType && selectedResourceType
            ? `Create New ${selectedResourceType.name} Resource`
            : "Create New Resource"}
        </h1>
        <p className="text-muted-foreground">
          {flow.currentStep?.label || "Set up your new resource"}
        </p>
      </div>

      {/* Progress Indicator */}
      <CreationProgressBar
        steps={flow.steps}
        currentStepIndex={flow.currentStepIndex}
      />

      {/* Step Content */}
      <div className="space-y-6">
        {flow.currentStep?.id === "project" && (
          <ProjectSelectionStep
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
            onProjectCreated={handleProjectCreated}
            isLoading={projectsLoading}
          />
        )}

        {flow.currentStep?.id === "resourceType" && (
          <ResourceTypeStep
            resourceTypes={catalogResourceTypes}
            selectedType={flow.state.resourceType}
            onTypeSelect={handleResourceTypeSelect}
          />
        )}

        {flow.currentStep?.id === "tier" && (
          <ConfigureResourceStep
            resourceType={selectedResourceType}
            resourceName={flow.state.resourceName}
            selectedSku={flow.state.sku}
            onNameChange={handleNameChange}
            onSkuSelect={(sku) => flow.setState({ sku })}
            projects={isGlobalCreateRoute ? projects : undefined}
            selectedProjectId={selectedProjectId}
            onProjectSelect={
              isGlobalCreateRoute ? handleProjectSelect : undefined
            }
            onProjectCreated={
              isGlobalCreateRoute ? handleProjectCreated : undefined
            }
            showProjectSelection={isGlobalCreateRoute}
            isLoadingProjects={projectsLoading}
          />
        )}

        {flow.currentStep?.id === "billing" && (
          <BillingSetupStep
            key={
              String(billingStatus?.hasStripeCustomer) +
              String(billingStatus?.hasPaymentMethod)
            }
            projectId={selectedProjectId || ""}
            resourceType={flow.state.resourceType}
            sku={flow.state.sku}
            tierName={selectedTier?.name}
            onSetupBilling={() => setShowBillingSetupModal(true)}
            isLoading={billingLoading}
            hasStripeCustomer={billingStatus?.hasStripeCustomer}
            hasPaymentMethod={billingStatus?.hasPaymentMethod}
          />
        )}

        {flow.currentStep?.id === "settings" && (
          <SettingsConfigurationStep
            resourceType={selectedResourceType}
            resourceName={flow.state.resourceName}
            tierName={selectedTier?.name}
            onSubmit={() => {}} // No-op for submission from form itself
            onChange={handleUpdateSettings}
            disabled={isCreating}
          />
        )}

        {flow.currentStep?.id === "access" && (
          <AccessControlStep
            resourceName={flow.state.resourceName}
            onSkip={() => handleCreateResource()}
            onConfigure={() => {
              // TODO: Implement access configuration
              toast.info(
                "Access configuration will be available after resource creation"
              );
              handleCreateResource();
            }}
          />
        )}

        {/* Navigation Buttons */}
        {(flow.currentStep?.id !== "settings" ||
          flow.state.resourceType === "Konnektr.Secret") &&
          flow.currentStep?.id !== "access" && (
            <div className="flex justify-between gap-3">
              {/* Hide Back button on first step of global route (no meaningful place to go back to) */}
              {flow.canGoBack && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                {!flow.currentStep?.required &&
                  flow.currentStep?.id !== "project" && (
                    <Button variant="ghost" onClick={flow.skipCurrentStep}>
                      Skip
                    </Button>
                  )}
                <Button
                  onClick={handleNext}
                  disabled={
                    !flow.canGoNext ||
                    isCreating ||
                    (flow.currentStep?.id === "project" && projectsLoading) ||
                    (flow.currentStep?.id === "tier" && !selectedProjectId)
                  }
                >
                  {isCreating
                    ? "Creating..."
                    : flow.isLastStep
                    ? "Create Resource"
                    : `Continue to ${flow.getNextStepLabel()}`}
                </Button>
              </div>
            </div>
          )}

        {/* Cancel Button */}
        {flow.currentStep?.id !== "settings" && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (urlProjectId) {
                  navigate(`/projects/${urlProjectId}/resources`);
                } else {
                  navigate("/projects");
                }
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
