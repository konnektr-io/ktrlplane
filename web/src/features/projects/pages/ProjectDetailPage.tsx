import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "../hooks/useProjectApi";
import { useResources } from "../../resources/hooks/useResourceApi";
import { useBilling } from "../../billing/hooks/useBillingApi";
import { useRoleAssignments } from "../../access/hooks/useAccessApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourceStatusBadge } from "@/features/resources/components/ResourceStatusBadge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarDays,
  Building2,
  Activity,
  Key,
  Edit2,
  Check,
  X,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Auth0ClientSecretViewer } from "../components/Auth0ClientSecretViewer";
import { DeleteProjectDialog } from "../components/DeleteProjectDialog";
import { useProjectSecret } from "../hooks/useProjectSecret";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: currentProject } = useProject(projectId ?? "");
  const { data: resources = [] } = useResources(projectId ?? "");
  const { data: billingInfo } = useBilling("project", projectId ?? "");
  const secretName = `auth0-client-${projectId}`;
  const { data: m2mSecret, isLoading: isLoadingSecret } = useProjectSecret(
    projectId ?? "",
    secretName
  );
  const hasM2MCredentials =
    !isLoadingSecret &&
    m2mSecret &&
    Object.keys(m2mSecret.data || {}).length > 0;
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

  // State for inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mutations
  const updateProjectMutation = useUpdateProject(projectId ?? "");
  const deleteProjectMutation = useDeleteProject(projectId ?? "");

  // Name editing handlers
  const handleNameEdit = () => {
    setEditedName(currentProject?.name || "");
    setIsEditingName(true);
    setNameError(null);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setNameError("Project name cannot be empty");
      return;
    }
    if (editedName === currentProject?.name) {
      setIsEditingName(false);
      return;
    }
    updateProjectMutation.mutate(
      { name: editedName },
      {
        onSuccess: () => {
          setIsEditingName(false);
          setNameError(null);
          toast.success("Project name updated successfully");
        },
        onError: (error: unknown) => {
          if (
            error &&
            typeof error === "object" &&
            "response" in error &&
            typeof (error as { response?: { data?: { error?: unknown } } })
              .response?.data?.error !== "undefined"
          ) {
            const errVal = (
              error as { response?: { data?: { error?: unknown } } }
            ).response?.data?.error;
            setNameError(typeof errVal === "string" ? errVal : String(errVal));
          } else {
            setNameError("Failed to update project name");
          }
        },
      }
    );
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName("");
    setNameError(null);
  };

  // Delete handlers
  const handleDeleteProject = () => {
    deleteProjectMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Project and all its resources have been deleted");
        navigate("/projects");
      },
      onError: (error: unknown) => {
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } })
            .response?.data?.error === "string"
        ) {
          toast.error(
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          );
        } else {
          toast.error("Failed to delete project");
        }
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with editable name */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditingName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 max-w-xl">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold h-auto py-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameSave();
                      if (e.key === "Escape") handleNameCancel();
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleNameSave}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNameCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {nameError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{nameError}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {currentProject?.name || "Project Overview"}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNameEdit}
                  className="h-8 w-8"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground mt-1">
              {currentProject?.description || "Project details and overview"}
            </p>
          </div>
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
                    currentProject?.status === "Active"
                      ? "default"
                      : "secondary"
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
                  <p className="text-sm text-muted-foreground">
                    No Organization
                  </p>
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
                            (item.price?.unit_amount ?? 0) *
                              (item.quantity ?? 1),
                          0
                        ) / 100
                      }${
                        billingInfo.subscription_items[0].price?.currency
                          ? ` ${billingInfo.subscription_items[0].price.currency.toUpperCase()}`
                          : ""
                      }`
                    : "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Monthly Cost
                </div>
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
                {resources.filter((r) => r.type !== "Konnektr.Secret").slice(0, 5).map((resource) => (
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
                    <ResourceStatusBadge status={resource.status} />
                  </a>
                ))}
              </div>
              {/* Add Resource button moved to header */}
            </CardContent>
          </Card>
        )}

        {/* API Authentication Section (hide if no M2M credentials) */}
        {hasM2MCredentials && (
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
        )}

        {/* Dangerous Actions */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
              <div>
                <p className="font-medium">Delete this project</p>
                <p className="text-sm text-muted-foreground">
                  Once you delete a project, there is no going back. All
                  resources and data will be permanently deleted.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="ml-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {currentProject && (
        <DeleteProjectDialog
          projectName={currentProject.name}
          projectId={currentProject.project_id}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteProject}
          isDeleting={deleteProjectMutation.status === "pending"}
        />
      )}
    </>
  );
}
