import { useParams } from "react-router-dom";
import { useResource } from "../hooks/useResourceApi";
import AccessControl from "@/features/access/components/AccessControl";

export default function ResourceAccessPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();
  const {
    data: currentResource,
    isLoading,
    error,
  } = useResource(projectId!, resourceId!);

  if (isLoading) {
    return <div>Loading resource...</div>;
  }
  if (error) {
    return (
      <div className="text-red-500">
        Error: {error.message || String(error)}
      </div>
    );
  }
  if (!resourceId || !currentResource) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Resource not found</p>
      </div>
    );
  }

  return (
    <AccessControl
      context={{
        scopeType: "resource",
        scopeId: resourceId,
        scopeName: currentResource.name,
      }}
    />
  );
}
