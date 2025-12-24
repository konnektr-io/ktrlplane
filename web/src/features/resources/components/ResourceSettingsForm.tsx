import { GraphForm } from "./graph/GraphForm";
import { SecretForm, SecretSettings } from "./secret/SecretForm";
import type { GraphSettings } from "@/features/resources/schemas/GraphSchema";

interface ResourceSettingsFormProps {
  resourceType: string;
  projectId?: string;
  initialValues?: GraphSettings | SecretSettings | Record<string, unknown>;
  onSubmit: (values: GraphSettings | SecretSettings) => void | Promise<void>;
  onChange?: (values: GraphSettings | SecretSettings) => void;
  disabled?: boolean;
  hideSaveButton?: boolean;
}

export function ResourceSettingsForm({
  resourceType,
  projectId,
  initialValues,
  onSubmit,
  onChange,
  disabled,
  hideSaveButton,
}: ResourceSettingsFormProps) {
  if (resourceType === "Konnektr.Graph") {
    return (
      <GraphForm
        initialValues={initialValues as GraphSettings | undefined}
        onSave={onSubmit as (values: GraphSettings) => Promise<void>}
        disabled={disabled}
        projectId={projectId || ""}
        hideSaveButtons={hideSaveButton}
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
