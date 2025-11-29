import { useParams, Link } from "react-router-dom";
import { useProject } from "../hooks/useProjectApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Building2, Activity } from "lucide-react";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { data: currentProject } = useProject(projectId ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {currentProject?.name || "Project Overview"}
        </h1>
        <p className="text-muted-foreground">
          {currentProject?.description || "Project details and overview"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge
                variant={
                  currentProject?.status === "Active" ? "default" : "secondary"
                }
              >
                {currentProject?.status || "Unknown"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Project ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {currentProject?.project_id || projectId}
              </p>
            </div>
            {currentProject?.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {currentProject.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentProject?.org_id ? (
              <div>
                <p className="text-sm font-medium">Organization ID</p>
                <Link
                  to={`/organizations/${currentProject.org_id}/settings`}
                  className="text-sm text-muted-foreground font-mono hover:text-foreground"
                >
                  {currentProject.org_id}
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-muted-foreground">No Organization</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentProject?.created_at && (
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentProject.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {currentProject?.updated_at && (
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentProject.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions or Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>
            Project metrics and overview information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Deployments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
