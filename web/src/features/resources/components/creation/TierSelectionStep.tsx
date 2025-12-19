import { useState } from "react";
import { Check, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceTierCard } from "../ResourceTierCard";
import type { ResourceType } from "../../catalog/resourceTypes";
import { generateDNSId } from "@/lib/dnsUtils";
import { useCreateProject } from "@/features/projects/hooks/useProjectApi";
import { toast } from "sonner";

interface Project {
  project_id: string;
  name: string;
}

interface TierSelectionStepProps {
  resourceType: ResourceType | undefined;
  resourceName: string;
  selectedSku: string;
  onNameChange: (name: string) => void;
  onSkuSelect: (sku: string) => void;
  preselectedSku?: string | null;
  // Optional project selection/creation props
  projects?: Project[];
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string) => void;
  onProjectCreated?: (projectId: string) => void;
  showProjectSelection?: boolean;
}

export function TierSelectionStep({
  resourceType,
  resourceName,
  selectedSku,
  onNameChange,
  onSkuSelect,
  projects,
  selectedProjectId,
  onProjectSelect,
  onProjectCreated,
  showProjectSelection = false,
}: TierSelectionStepProps) {
  const [showCreateForm, setShowCreateForm] = useState(
    !projects || projects.length === 0
  );
  const { mutateAsync: createProject } = useCreateProject();
  const [isCreating, setIsCreating] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
  });

  const handleProjectNameChange = (name: string) => {
    setProjectFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setIsCreating(true);
    try {
      const generatedId = generateDNSId(projectFormData.name);
      const newProject = await createProject({
        id: generatedId,
        name: projectFormData.name.trim(),
      });
      if (newProject) {
        toast.success("Project created successfully!");
        setProjectFormData({ name: "" });
        setShowCreateForm(false);
        if (onProjectCreated) {
          onProjectCreated(newProject.project_id);
        }
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Optional Project Selection/Creation - shown inline when needed */}
      {showProjectSelection && onProjectSelect && (
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
            <CardDescription>
              {!showCreateForm && projects && projects.length > 0
                ? "Select the project where this resource will be created"
                : "Create a project to organize your resources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCreateForm && projects && projects.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project-select">Project *</Label>
                  <select
                    id="project-select"
                    value={selectedProjectId || ""}
                    onChange={(e) => onProjectSelect(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="" disabled>
                      Select a project...
                    </option>
                    {projects.map((project) => (
                      <option
                        key={project.project_id}
                        value={project.project_id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    A unique ID will be auto-generated.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Project"}
                  </Button>
                  {projects && projects.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setProjectFormData({ name: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resource Information */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Information</CardTitle>
          <CardDescription>
            Choose a unique name and provide basic details for your{" "}
            {resourceType?.name || "resource"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name *</Label>
              <Input
                id="name"
                type="text"
                value={resourceName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter resource name"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                A unique ID will be auto-generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Selection - Only show if there are SKUs */}
      {resourceType && resourceType.skus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tier</CardTitle>
            <CardDescription>
              Choose the plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resourceType && resourceType.skus.length > 0 ? (
              <div className="grid gap-6">
                {resourceType.skus.map((tier) => (
                  <ResourceTierCard
                    key={tier.sku}
                    tier={tier}
                    resourceTypeId={resourceType.id}
                    selected={selectedSku === tier.sku}
                    onSelect={() => onSkuSelect(tier.sku)}
                  />
                ))}
              </div>
            ) : (
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
      )}
    </div>
  );
}
