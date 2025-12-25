import GraphResourceDetails from "./graph/GraphResourceDetails";
import SecretResourceDetails from "./secret/SecretResourceDetails";

import type { Resource } from "../types/resource.types";

export function ResourceDetailsPanel({ resource }: { resource: unknown }) {
  // Type guard: check if resource is Resource
  const isResource = (r: unknown): r is Resource =>
    typeof r === "object" && r !== null && "type" in r && "resource_id" in r;

  if (isResource(resource)) {
    switch (resource.type) {
      case "Konnektr.Graph":
        return <GraphResourceDetails resource={resource} />;
      case "Konnektr.Secret":
        return <SecretResourceDetails resource={resource} />;
      default:
        return (
          <div className="mb-4">
            <div className="text-muted-foreground">
              No additional details for this resource type.
            </div>
          </div>
        );
    }
  }
  // Fallback if not a Resource
  return (
    <div className="mb-4">
      <div className="text-muted-foreground">Invalid resource object.</div>
    </div>
  );
}
export default ResourceDetailsPanel;
