import { ProjectSecretViewer } from "@/features/projects/components/ProjectSecretViewer";
import type { Resource } from "../types/resource.types";

interface SecretResourceDetailsProps {
  resource: Resource;
}

export default function SecretResourceDetails({
  resource,
}: SecretResourceDetailsProps) {
  return (
    <div className="space-y-6">
      <ProjectSecretViewer
        projectId={resource.project_id}
        secretName={resource.name} // Assuming resource name maps to secret name
        title="Secret Values"
        description="Manage and view the values for this secret."
      />
    </div>
  );
}
