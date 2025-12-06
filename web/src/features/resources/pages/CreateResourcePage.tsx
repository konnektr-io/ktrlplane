import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateResource } from "../hooks/useResourceApi";
import { isPaidResource } from "@/features/billing/utils/isPaidResource";
import { useBillingStatus } from "@/features/billing/hooks/useBillingApi";
import { UnifiedBillingSetupModal } from "@/features/billing/components/BillingSetupModal";
import type { CreateResourceData } from "../types/resource.types";
import type { ResourceType } from "../schemas";
import { defaultConfigurations } from "@/features/resources/schemas";
import { generateDNSId, slugify } from "@/lib/dnsUtils";
import { useProjects } from "@/features/projects/hooks/useProjectApi";
import { resourceTypes as catalogResourceTypes } from "@/features/resources/catalog/resourceTypes";
import { useResourceCreationFlow } from "../hooks/useResourceCreationFlow";
import {
  CreationProgressBar,
  ProjectSelectionStep,
  ResourceTypeStep,
  TierSelectionStep,
  BillingSetupStep,
  SettingsConfigurationStep,
  AccessControlStep,
} from "../components/creation";

export default function CreateResourcePage() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const navigate = useNavigate();

  // Determine if we're on the global create route
  const isGlobalCreateRoute = window.location.pathname === "/resources/create";

  // Billing status for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    urlProjectId || (projects.length > 0 ? projects[0].project_id : null)
  );

  const {
    data: billingStatus,
    isLoading: billingLoading,
    refetch: refetchBillingStatus,
  } = useBillingStatus("project", selectedProjectId || "");

  // Sync selectedProjectId when projects are loaded (async data)
  // Also sync the flow state's projectId
  useEffect(() => {
    if (!urlProjectId && !selectedProjectId && projects.length > 0) {
      const firstProjectId = projects[0].project_id;
      setSelectedProjectId(firstProjectId);
    }
  }, [projects, urlProjectId, selectedProjectId]);

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
    isGlobalRoute: isGlobalCreateRoute,
  });

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

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
    flow.setState({ projectId });
    flow.goNext();
  };

  // Resource type selection
  const handleResourceTypeSelect = (type: ResourceType) => {
    flow.setState({ resourceType: type });

    // Auto-select first available SKU for this resource type
    const catalogType = catalogResourceTypes.find((rt) => rt.id === type);
    if (catalogType && catalogType.skus.length > 0) {
      flow.setState({ sku: catalogType.skus[0].sku });
    }
  };

  // Name change handler with auto-ID generation
  const handleNameChange = (name: string) => {
    const currentId = flow.state.resourceId;
    const currentName = flow.state.resourceName;

    flow.setState({
      resourceName: name,
      resourceId:
        currentId === "" ||
        currentId === slugify(currentName) + "-" + currentId.slice(-4)
          ? generateDNSId(name)
          : currentId,
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
        type: flow.state.resourceType as ResourceType,
        sku,
        settings_json: settingsJson,
      };
      const newResource = await createResourceMutation.mutateAsync(payload);
      if (newResource) {
        toast.success("Resource created successfully!");
        navigate(
          `/projects/${selectedProjectId}/resources/${newResource.resource_id}`
        );
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
      if (urlProjectId) {
        navigate(`/projects/${urlProjectId}/resources`);
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
        // Settings will be submitted via form
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
        <h1 className="text-2xl font-bold">Create New Resource</h1>
        <p className="text-muted-foreground">
          {flow.currentStep?.label || "Set up your new resource"}
        </p>

        {/* Pre-selected info banner */}
        {flow.preselectedResourceType && selectedResourceType && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Pre-selected:</span>{" "}
              {selectedResourceType.name}
              {flow.preselectedSku && ` - ${flow.preselectedSku}`}
            </p>
          </div>
        )}
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
          <TierSelectionStep
            resourceType={selectedResourceType}
            resourceName={flow.state.resourceName}
            resourceId={flow.state.resourceId}
            selectedSku={flow.state.sku}
            onNameChange={handleNameChange}
            onIdChange={(id) => flow.setState({ resourceId: id })}
            onSkuSelect={(sku) => flow.setState({ sku })}
            preselectedSku={flow.preselectedSku}
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
            tierPrice={selectedTier?.price}
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
            initialValues={
              flow.state.resourceType === "Konnektr.Graph"
                ? (defaultConfigurations[
                    "Konnektr.Graph"
                  ] as import("@/features/resources/schemas/GraphSchema").GraphSettings)
                : flow.state.resourceType === "Konnektr.Flow"
                ? (defaultConfigurations[
                    "Konnektr.Flow"
                  ] as import("@/features/resources/schemas/FlowSchema").FlowSettings)
                : undefined
            }
            onSubmit={handleCreateResource}
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
        {flow.currentStep?.id !== "settings" &&
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
                    (flow.currentStep?.id === "project" && projectsLoading)
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
