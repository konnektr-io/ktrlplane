import { GraphForm } from "./graph/GraphForm";
import { FlowForm } from "./flow/FlowForm";

interface ResourceSettingsFormProps {
  resourceType: string;
  initialValues?: any;
  onSubmit: (values: any) => void;
  disabled?: boolean;
}

export function ResourceSettingsForm({
  resourceType,
  initialValues,
  onSubmit,
  disabled,
}: ResourceSettingsFormProps) {
  // Handle different resource types with proper typing
  if (resourceType === "Konnektr.Graph") {
    return (
      <GraphForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  }

  if (resourceType === "Konnektr.Flow") {
    return (
      <FlowForm
        initialValues={initialValues}
        onSubmit={onSubmit}
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
