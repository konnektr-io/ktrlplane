import { GraphForm } from "./graph/GraphForm";
import { FlowForm } from "./flow/FlowForm";
import type { GraphSettings } from "@/features/resources/schemas/GraphSchema";
import type { FlowSettings } from "@/features/resources/schemas/FlowSchema";

interface ResourceSettingsFormProps {
  resourceType: string;
  initialValues?: GraphSettings | FlowSettings;
  onSubmit: (values: GraphSettings | FlowSettings) => void;
  disabled?: boolean;
}

export function ResourceSettingsForm({
  resourceType,
  initialValues,
  onSubmit,
  disabled,
}: ResourceSettingsFormProps) {
  // Type guards for initialValues and onSubmit
  if (resourceType === "Konnektr.Graph") {
    return (
      <GraphForm
        initialValues={initialValues as GraphSettings | undefined}
        onSubmit={onSubmit as (values: GraphSettings) => void}
        disabled={disabled}
      />
    );
  }

  if (resourceType === "Konnektr.Flow") {
    return (
      <FlowForm
        initialValues={initialValues as FlowSettings | undefined}
        onSubmit={onSubmit as (values: FlowSettings) => void}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        Unknown resource type: {resourceType}
      </p>
    </div>
  );
}

export default ResourceSettingsForm;
