
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { useProjects } from "../hooks/useProjectApi";



// Accept optional organizationId prop (for direct usage or from route params)
type ProjectListPageProps = {
  organizationId?: string;
};

export default function ProjectListPage(props: ProjectListPageProps = {}) {
  const { orgId } = useParams<{ orgId?: string }>();
  const organizationId = props.organizationId || orgId;
  const navigate = useNavigate();
  const { data: allProjects = [], isLoading, isError, error } = useProjects();

  // Filter projects by organization if organizationId is present
  const projects = organizationId
    ? allProjects.filter((p) => p.org_id === organizationId)
    : allProjects;

  if (isLoading) {
    return <div>Loading projects...</div>;
  }
  if (isError) {
    return <div className="text-red-500">Error loading projects: {error?.message || "Unknown error"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your ktrlplane projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No projects found. Create your first project!
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.project_id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description || "No description"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    project.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.project_id}`)}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
