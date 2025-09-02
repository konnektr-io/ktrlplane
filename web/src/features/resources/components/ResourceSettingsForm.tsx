import { DigitalTwinsForm } from "./digital-twins/DigitalTwinsForm";
import { FlowsForm } from "./flows/FlowsForm";

interface ResourceSettingsFormProps {
  resourceType: string;
  initialValues?: any;
  onSubmit: (values: any) => void;
  disabled?: boolean;
}

export function ResourceSettingsForm({ resourceType, initialValues, onSubmit, disabled }: ResourceSettingsFormProps) {
  // Handle different resource types with proper typing
  if (resourceType === 'Konnektr.DigitalTwins') {
    return <DigitalTwinsForm initialValues={initialValues} onSubmit={onSubmit} disabled={disabled} />;
  }
  
  if (resourceType === 'Konnektr.Flows') {
    return <FlowsForm initialValues={initialValues} onSubmit={onSubmit} disabled={disabled} />;
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Unknown resource type: {resourceType}</p>
    </div>
  );
}

export default ResourceSettingsForm;
