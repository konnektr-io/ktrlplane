import { useParams } from 'react-router-dom';
import { useProject } from "../hooks/useProjectApi";
import AccessControl from "@/features/access/components/AccessControl";

export default function ProjectAccessPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: currentProject, isLoading, error } = useProject(projectId!);

  if (isLoading) {
    return <div>Loading resource...</div>;
  }
  if (error) {
    return (
      <div className="text-red-500">
        Error: {typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)}
      </div>
    );
  }
  if (!projectId || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <AccessControl
      context={{
        scopeType: "project",
        scopeId: projectId,
        scopeName: currentProject.name,
      }}
    />
  );
}
