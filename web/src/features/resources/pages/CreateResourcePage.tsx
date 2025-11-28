import CreateProjectDialog from "@/features/projects/components/CreateProjectDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Database, Workflow, ArrowLeft, Check } from "lucide-react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateResource } from "../hooks/useResourceApi";
import type { CreateResourceData } from "../types/resource.types";
import type { ResourceType } from "../schemas";
import { defaultConfigurations } from "@/features/resources/schemas";
import { ResourceSettingsForm } from "../components/ResourceSettingsForm";
import { generateDNSId, validateDNSId, slugify } from "@/lib/dnsUtils";
import { useProjects } from "@/features/projects/hooks/useProjectApi";
import { resourceTypes as catalogResourceTypes } from "@/features/catalog/resourceTypes";

const resourceTypes = [
  {
    value: "Konnektr.Graph",
    label: "Graph",
    description:
      "High-performance graph database and API layer for digital twin data and event processing.",
    icon: Database,
  },
  {
    value: "Konnektr.Flow",
    label: "Flow",
    description:
      "Real-time data and event processing engine for digital twins and automation.",
    icon: Workflow,
  },
  {
    value: "Konnektr.Assembler",
    label: "Assembler",
    description:
      "AI-powered digital twin builder for automated model generation.",
    icon: Database,
  },
  {
    value: "Konnektr.Compass",
    label: "Compass",
    description:
      "Navigation and discovery tool for digital twin analytics and simulation.",
    icon: Database,
  },
];

export default function CreateResourcePage() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const { data: projects = [] } = useProjects();
  // For lastProjectId and setLastProjectId, consider using local state or a context if needed
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // ...existing code...
  // Place this after selectedProjectId is defined

  // Get the resource type from URL - it may be provided from external links
  const preselectedResourceType = searchParams.get("resourceType");

  // Project selection logic
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    urlProjectId || (projects.length > 0 ? projects[0].project_id : null)
  );

  // Fetch projects on mount if not loaded
  // Auto-select first project if none selected and projects are loaded
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].project_id);
    }
  }, [projects, selectedProjectId]);

  // No longer redirect to catalog - allow resource type selection on this page

  // Start with resource type selection if not pre-selected, otherwise tier selection
  const [step, setStep] = useState<"resourceType" | "tier" | "configuration">(
    preselectedResourceType ? "tier" : "resourceType"
  );
  const [isCreating, setIsCreating] = useState(false);
  const [basicData, setBasicData] = useState<{
    id: string;
    name: string;
    type: ResourceType | "";
    sku: string;
  }>({
    id: "",
    name: "",
    type: (preselectedResourceType as ResourceType) || "",
    sku: "free",
  });

  // Pre-select resource type and first available SKU from URL parameters
  useEffect(() => {
    if (
      preselectedResourceType &&
      resourceTypes.find((rt) => rt.value === preselectedResourceType)
    ) {
      setBasicData((prev) => ({
        ...prev,
        type: preselectedResourceType as ResourceType,
      }));

      // Auto-select first available SKU for this resource type
      const catalogType = catalogResourceTypes.find(
        (rt) => rt.id === preselectedResourceType
      );
      if (catalogType && catalogType.skus.length > 0) {
        setBasicData((prev) => ({ ...prev, sku: catalogType.skus[0].sku }));
      }
    }
  }, [preselectedResourceType]);

  const handleNameChange = (name: string) => {
    setBasicData((prev) => ({
      ...prev,
      name,
      // Auto-generate ID from name if ID is empty or was auto-generated
      id:
        prev.id === "" ||
        prev.id === slugify(prev.name) + "-" + prev.id.slice(-4)
          ? generateDNSId(name)
          : prev.id,
    }));
  };

  const createResourceMutation = useCreateResource(selectedProjectId || "");

  const handleConfigurationSubmit = async (configuration: unknown) => {
    if (!selectedProjectId) {
      toast.error("Please select a project before creating a resource.");
      return;
    }

    setIsCreating(true);
    try {
      let settings: Record<string, unknown> | undefined = undefined;
      if (configuration && typeof configuration === "object") {
        settings = configuration as Record<string, unknown>;
      }
      const payload: CreateResourceData = {
        id: basicData.id.trim(),
        name: basicData.name.trim(),
        type: basicData.type as ResourceType,
        sku: basicData.sku,
        settings_json: settings,
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

  const selectedResourceType = resourceTypes.find(
    (rt) => rt.value === basicData.type
  );
  const selectedCatalogType = catalogResourceTypes.find(
    (rt) => rt.id === basicData.type
  );

  const getBackButtonText = () => {
    if (step === "configuration") {
      return "Back to Tier Selection";
    } else if (step === "tier") {
      return "Back to Resource Selection";
    } else {
      return "Back to Resources";
    }
  };

  const handleBackClick = () => {
    if (step === "configuration") {
      setStep("tier");
    } else if (step === "tier") {
      setStep("resourceType");
    } else {
      navigate(`/projects/${selectedProjectId}/resources`);
    }
  };

  // Determine if we're on the global create route
  const isGlobalCreateRoute = window.location.pathname === "/resources/create";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        {/* Project Selection Dropdown - only show on global create route */}
        {isGlobalCreateRoute && (
          <div className="mb-4 flex flex-col gap-2">
            <Label htmlFor="project-select">Select Project *</Label>
            {projects.length === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col gap-2 items-start">
                <span>No projects found.</span>
                <CreateProjectDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create a project
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <Select
                  value={selectedProjectId || ""}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem
                        key={project.project_id}
                        value={project.project_id}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <CreateProjectDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                      </Button>
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {getBackButtonText()}
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Create New Resource</h1>
        <p className="text-muted-foreground">
          {step === "resourceType"
            ? "Choose the type of resource you want to create"
            : step === "tier"
            ? "Select a tier that fits your needs"
            : "Configure your resource settings for deployment"}
        </p>
        {/* Show helpful message if resource type was preselected */}
        {preselectedResourceType && selectedResourceType && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Pre-selected:</span>{" "}
              {selectedResourceType.label} resource type
            </p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center mb-8">
        {/* Step 1: Resource Type */}
        <div
          className={`flex items-center ${
            step === "resourceType"
              ? "text-primary"
              : step === "tier" || step === "configuration"
              ? "text-green-600"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              step === "resourceType"
                ? "border-primary bg-primary text-primary-foreground"
                : step === "tier" || step === "configuration"
                ? "border-green-600 bg-green-600 text-white"
                : "border-muted-foreground"
            }`}
          >
            {step === "resourceType" ? "1" : <Check className="h-4 w-4" />}
          </div>
          <span className="ml-2 font-medium">Select Resource Type</span>
        </div>

        <div
          className={`flex-1 h-0.5 mx-4 ${
            step === "tier" || step === "configuration"
              ? "bg-primary"
              : "bg-muted"
          }`}
        />

        {/* Step 2: Tier Selection */}
        <div
          className={`flex items-center ${
            step === "tier"
              ? "text-primary"
              : step === "configuration"
              ? "text-green-600"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              step === "tier"
                ? "border-primary bg-primary text-primary-foreground"
                : step === "configuration"
                ? "border-green-600 bg-green-600 text-white"
                : "border-muted-foreground"
            }`}
          >
            {step === "tier" ? (
              "2"
            ) : step === "configuration" ? (
              <Check className="h-4 w-4" />
            ) : (
              "2"
            )}
          </div>
          <span className="ml-2 font-medium">Select Tier</span>
        </div>

        <div
          className={`flex-1 h-0.5 mx-4 ${
            step === "configuration" ? "bg-primary" : "bg-muted"
          }`}
        />

        {/* Step 3: Configuration */}
        <div
          className={`flex items-center ${
            step === "configuration" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              step === "configuration"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground"
            }`}
          >
            3
          </div>
          <span className="ml-2 font-medium">Configuration</span>
        </div>
      </div>

      {/* Step Content */}
      {step === "resourceType" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Resource Type</CardTitle>
              <CardDescription>
                Choose the type of resource you want to create for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {resourceTypes.map((resourceType) => {
                  const IconComponent = resourceType.icon;
                  const isSelected = basicData.type === resourceType.value;

                  return (
                    <div
                      key={resourceType.value}
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onClick={() => {
                        setBasicData((prev) => ({
                          ...prev,
                          type: resourceType.value as ResourceType,
                        }));

                        // Auto-select first available SKU for this resource type
                        const catalogType = catalogResourceTypes.find(
                          (rt) => rt.id === resourceType.value
                        );
                        if (catalogType && catalogType.skus.length > 0) {
                          setBasicData((prev) => ({
                            ...prev,
                            sku: catalogType.skus[0].sku,
                          }));
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="h-6 w-6 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {resourceType.label}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resourceType.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackClick}>
              {getBackButtonText()}
            </Button>
            <Button onClick={() => setStep("tier")} disabled={!basicData.type}>
              Continue to Tier Selection
            </Button>
          </div>
        </div>
      )}

      {step === "tier" && (
        <div className="space-y-6">
          {/* Resource Information */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
              <CardDescription>
                Choose a unique name and provide basic details for your{" "}
                {selectedResourceType?.label || basicData.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={basicData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., production-digital-twins"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Display name for your resource
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">ID *</Label>
                  <Input
                    id="id"
                    type="text"
                    value={basicData.id}
                    onChange={(e) =>
                      setBasicData((prev) => ({ ...prev, id: e.target.value }))
                    }
                    placeholder="e.g., production-digital-twins-4f2a"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to auto-generate.
                  </p>
                  {basicData.id && validateDNSId(basicData.id) && (
                    <p className="text-sm text-red-500">
                      {validateDNSId(basicData.id)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedResourceType && (
                  <selectedResourceType.icon className="h-5 w-5" />
                )}
                Select {preselectedResourceType} Tier
              </CardTitle>
              <CardDescription>
                Choose the tier that best fits your needs. You can upgrade or
                downgrade at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tier Options */}
              {selectedCatalogType ? (
                <div className="grid gap-6">
                  {selectedCatalogType.skus.map((tier) => (
                    <Card
                      key={tier.sku}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        basicData.sku === tier.sku
                          ? "ring-2 ring-primary shadow-md scale-[1.02]"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() =>
                        setBasicData((prev) => ({ ...prev, sku: tier.sku }))
                      }
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <input
                              type="radio"
                              name="resourceTier"
                              value={tier.sku}
                              checked={basicData.sku === tier.sku}
                              onChange={() =>
                                setBasicData((prev) => ({
                                  ...prev,
                                  sku: tier.sku,
                                }))
                              }
                              className="h-4 w-4"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-xl text-foreground">
                                {tier.name}
                              </h4>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-primary">
                                  {tier.price}
                                </span>
                                {tier.price !== "$0/mo" && (
                                  <p className="text-xs text-muted-foreground">
                                    per month
                                  </p>
                                )}
                              </div>
                            </div>
                            <ul className="space-y-2 mb-4">
                              {tier.features.map((feature, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-muted-foreground flex items-center gap-2"
                                >
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {Object.entries(tier.limits).length > 0 && (
                              <div className="border-t pt-3">
                                <p className="text-sm font-medium mb-2">
                                  Resource Limits:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(tier.limits).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="text-xs text-muted-foreground"
                                      >
                                        <span className="font-medium">
                                          {key}:
                                        </span>{" "}
                                        {value}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Fallback for resource types without catalog definition */
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    This resource type uses the free tier by default.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Free tier selected</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setStep("configuration")}
              disabled={
                !basicData.name.trim() ||
                !basicData.id.trim() ||
                (selectedCatalogType &&
                  selectedCatalogType.skus.length > 0 &&
                  !basicData.sku)
              }
              className="flex-1"
            >
              Continue to Configuration
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/projects/${selectedProjectId}/resources`)
              }
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "configuration" && selectedResourceType && (
        <div className="space-y-6">
          {/* Configuration Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <selectedResourceType.icon className="h-5 w-5" />
                Configure {selectedResourceType.label}
              </CardTitle>
              <CardDescription>
                <span className="font-medium">Resource:</span> {basicData.name}
                <br />
                <span className="font-medium">Tier:</span>{" "}
                {selectedCatalogType?.skus.find((s) => s.sku === basicData.sku)
                  ?.name || basicData.sku}
                <br />
                {selectedResourceType.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Configuration Form */}
          <ResourceSettingsForm
            resourceType={basicData.type}
            initialValues={
              basicData.type === "Konnektr.Graph"
                ? (defaultConfigurations[
                    "Konnektr.Graph"
                  ] as import("@/features/resources/schemas/GraphSchema").GraphSettings)
                : basicData.type === "Konnektr.Flow"
                ? (defaultConfigurations[
                    "Konnektr.Flow"
                  ] as import("@/features/resources/schemas/FlowSchema").FlowSettings)
                : undefined
            }
            onSubmit={handleConfigurationSubmit}
            disabled={isCreating}
          />

          {/* Cancel Action */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("tier")}
              disabled={isCreating}
            >
              Back to Tier Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
