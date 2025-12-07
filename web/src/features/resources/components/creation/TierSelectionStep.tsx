import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceTierCard } from "../ResourceTierCard";
import type { ResourceType } from "../../catalog/resourceTypes";

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
  showProjectSelection = false,
}: TierSelectionStepProps) {
  return (
    <div className="space-y-6">
      {/* Optional Project Selection - shown inline when needed */}
      {showProjectSelection && onProjectSelect && (
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
            <CardDescription>
              {projects && projects.length > 0
                ? "Select the project where this resource will be created"
                : "You need to create a project first before creating resources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
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
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  No projects available. Please go back and create a project
                  first.
                </p>
              </div>
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

      {/* Tier Selection */}
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
    </div>
  );
}
