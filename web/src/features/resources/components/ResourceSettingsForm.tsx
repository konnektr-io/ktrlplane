import { GraphForm } from "./graph/GraphForm";
import { FlowForm } from "./flow/FlowForm";
import { SecretForm, SecretSettings } from "./secret/SecretForm";
import type { GraphSettings } from "@/features/resources/schemas/GraphSchema";
import type { FlowSettings } from "@/features/resources/schemas/FlowSchema";

interface ResourceSettingsFormProps {
  resourceType: string;
  initialValues?: GraphSettings | FlowSettings | SecretSettings;
  onSubmit: (values: GraphSettings | FlowSettings | SecretSettings) => void;
  onChange?: (values: GraphSettings | FlowSettings | SecretSettings) => void;
  disabled?: boolean;
  hideSaveButton?: boolean;
}

export function ResourceSettingsForm({
  resourceType,
  initialValues,
  onSubmit,
  onChange,
  disabled,
  hideSaveButton,
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

  if (resourceType === "Konnektr.Secret") {
    return (
      <SecretForm
        initialValues={initialValues as SecretSettings | undefined}
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
