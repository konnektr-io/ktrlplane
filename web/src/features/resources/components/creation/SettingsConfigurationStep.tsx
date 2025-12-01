import { ResourceSettingsForm } from "../ResourceSettingsForm";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResourceType } from "../../catalog/resourceTypes";
import type { GraphSettings } from "../../schemas/GraphSchema";
import type { FlowSettings } from "../../schemas/FlowSchema";

interface SettingsConfigurationStepProps {
  resourceType: ResourceType | undefined;
  resourceName: string;
  tierName?: string;
  initialValues?: GraphSettings | FlowSettings;
  onSubmit: (settings: GraphSettings | FlowSettings) => void;
  disabled?: boolean;
}

export function SettingsConfigurationStep({
  resourceType,
  resourceName,
  tierName,
  initialValues,
  onSubmit,
  disabled,
}: SettingsConfigurationStepProps) {
  if (!resourceType) return null;

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <resourceType.icon className="h-5 w-5" />
            Configure {resourceType.name}
          </CardTitle>
          <CardDescription>
            <span className="font-medium">Resource:</span> {resourceName}
            {tierName && (
              <>
                <br />
                <span className="font-medium">Tier:</span> {tierName}
              </>
            )}
            <br />
            {resourceType.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration Form */}
      <ResourceSettingsForm
        resourceType={resourceType.id}
        initialValues={initialValues}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </div>
  );
}
