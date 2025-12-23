import { GraphForm } from "./graph/GraphForm";
import { SecretForm, SecretSettings } from "./secret/SecretForm";
import type { GraphSettings } from "@/features/resources/schemas/GraphSchema";

interface ResourceSettingsFormProps {
  resourceType: string;
  projectId?: string;
  onSubmit: (values: GraphSettings | SecretSettings) => void;
  onChange?: (values: GraphSettings | SecretSettings) => void;
  disabled?: boolean;
  hideSaveButton?: boolean;
}

export function ResourceSettingsForm({
  resourceType,
  projectId,
  onSubmit,
  onChange,
  disabled,
  hideSaveButton,
}: ResourceSettingsFormProps) {
  // Type guards for initialValues and onSubmit
  if (resourceType === "Konnektr.Graph") {
    return (
      <GraphForm
        onSubmit={onSubmit as (values: GraphSettings) => void}
        disabled={disabled}
        projectId={projectId || ""}
      />
    );
  }

  if (resourceType === "Konnektr.Secret") {
    return (
      <SecretForm
        onSubmit={onSubmit as (values: SecretSettings) => void}
        onChange={onChange as (values: SecretSettings) => void}
        disabled={disabled}
        submitMode="manual"
        hideSaveButton={hideSaveButton}
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
