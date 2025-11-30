import GraphResourceDetails from "./graph/GraphResourceDetails";
import FlowResourceDetails from "./flow/FlowResourceDetails";

export function ResourceDetailsPanel({ resource }: { resource: any }) {
  switch (resource.type) {
    case "Konnektr.Graph":
      return <GraphResourceDetails resource={resource} />;
    case "Konnektr.Flow":
      return <FlowResourceDetails resource={resource} />;
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

export default ResourceDetailsPanel;
