import { useParams } from "react-router-dom";
import { useProject } from "../hooks/useProjectApi";
import { useResources } from "../../resources/hooks/useResourceApi";
import { useBilling } from "../../billing/hooks/useBillingApi";
import { useRoleAssignments } from "../../access/hooks/useAccessApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Building2, Activity, Key } from "lucide-react";
import { Auth0ClientSecretViewer } from "../components/Auth0ClientSecretViewer";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { data: currentProject } = useProject(projectId ?? "");
  const { data: resources = [] } = useResources(projectId ?? "");
  const { data: billingInfo } = useBilling("project", projectId ?? "");
  // Fetch all role assignments for this project (including inherited)
  const { data: roleAssignments = [] } = useRoleAssignments({
    scopeType: "project",
    scopeId: projectId ?? "",
    scopeName: currentProject?.name ?? "",
  });
  // Count unique users (prefer user.id, fallback to user_id on assignment)
  const uniqueUserCount = Array.from(
    new Set(roleAssignments.map((a) => a.user?.id ?? a.user_id).filter(Boolean))
  ).length;

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
                <a
                  href={`/organizations/${currentProject.org_id}/settings`}
                  className="text-sm text-muted-foreground font-mono hover:text-foreground"
                >
                  {currentProject.org_id}
                </a>
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

      {/* Project Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Project Metrics</CardTitle>
          <CardDescription>High-level project statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{resources.length}</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{uniqueUserCount}</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {billingInfo?.billing_account?.stripe_customer_id ? (
                  <span className="text-green-600">Linked</span>
                ) : (
                  <span className="text-red-600">Not Linked</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Billing Account
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {billingInfo?.subscription_items &&
                billingInfo.subscription_items.length > 0
                  ? `${
                      billingInfo.subscription_items.reduce(
                        (sum, item) =>
                          sum +
                          (item.price?.unit_amount ?? 0) * (item.quantity ?? 1),
                        0
                      ) / 100
                    }${
                      billingInfo.subscription_items[0].price?.currency
                        ? ` ${billingInfo.subscription_items[0].price.currency.toUpperCase()}`
                        : ""
                    }`
                  : "-"}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Cost</div>
            </div>
          </div>
          {!billingInfo?.billing_account?.stripe_customer_id && (
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  (window.location.href = `/projects/${projectId}/billing`)
                }
              >
                Add Billing Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Authentication
          </CardTitle>
          <CardDescription>
            Machine-to-machine credentials for programmatic access to your
            project resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth0ClientSecretViewer projectId={projectId!} />
        </CardContent>
      </Card>

      {/* Recent Resources List */}
      {resources.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Resources</CardTitle>
              <CardDescription>Resources in this project</CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                (window.location.href = `/projects/${projectId}/resources/create`)
              }
            >
              Add Resource
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.slice(0, 5).map((resource) => (
                <a
                  key={resource.resource_id}
                  href={`/projects/${projectId}/resources/${resource.resource_id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  title={`View resource: ${resource.name}`}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <p className="font-medium mb-0">{resource.name}</p>
                      {resource.type && (
                        <span className="text-xs text-muted-foreground">
                          {resource.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      resource.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {resource.status}
                  </Badge>
                </a>
              ))}
            </div>
            {/* Add Resource button moved to header */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
