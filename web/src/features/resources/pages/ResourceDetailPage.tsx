import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useResource,
  useUpdateResource,
  useDeleteResource,
} from "../hooks/useResourceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarDays,
  Database,
  Activity,
  Edit2,
  Check,
  X,
  Settings2,
  AlertCircle,
} from "lucide-react";
import { ResourceStatusBadge } from "../components/ResourceStatusBadge";
import { ResourceDetailsPanel } from "../components/ResourceDetailsPanel";
import { ResourceTierChangeDialog } from "../components/ResourceTierChangeDialog";
import { DeleteResourceDialog } from "../components/DeleteResourceDialog";
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import { resourceTypes } from "../catalog/resourceTypes";

export default function ResourceDetailPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();
  // --- All hooks must be called before any return ---
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [tierSuccess, setTierSuccess] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: currentResource,
    isLoading,
    error,
    refetch,
  } = useResource(projectId!, resourceId!);
  const updateResourceMutation = useUpdateResource(projectId!, resourceId!);
  const deleteResourceMutation = useDeleteResource(projectId!, resourceId!);
  const { data: resourcePermissions = [] } = useUserPermissions(
    "resource",
    resourceId ?? ""
  );
  const { data: projectPermissions = [] } = useUserPermissions(
    "project",
    projectId ?? ""
  );
  const canEdit =
    resourcePermissions?.includes("write") ||
    projectPermissions?.includes("write");

  // --- Polling for transient statuses ---
  const transientStatuses = [
    "Creating",
    "Unknown",
    "Missing",
    "Progressing",
    "Degraded",
    "Terminating",
  ];
  const isTransient =
    currentResource &&
    transientStatuses.includes((currentResource.status || "").trim());

  useEffect(() => {
    if (isTransient) {
      pollingRef.current = setInterval(() => {
        refetch();
      }, 5000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // Only rerun when status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransient]);

  const handleNameEdit = () => {
    setEditedName(currentResource?.name || "");
    setIsEditingName(true);
    setNameError(null);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setNameError("Resource name cannot be empty");
      return;
    }
    try {
      await updateResourceMutation.mutateAsync({ name: editedName });
      setIsEditingName(false);
      setNameError(null);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update name"
      );
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName("");
    setNameError(null);
  };

  const handleTierChange = async (newSku: string) => {
    await updateResourceMutation.mutateAsync({ sku: newSku });
    setTierSuccess(true);
    setTimeout(() => setTierSuccess(false), 3000);
  };

  const resourceType = resourceTypes.find(
    (rt) => rt.id === currentResource?.type
  );
  const currentTier = resourceType?.skus.find(
    (t) => t.sku === currentResource?.sku
  );

  const handleDeleteResource = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteResourceMutation.mutateAsync();
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      navigate(`/projects/${projectId}/resources`);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete resource"
      );
      setIsDeleting(false);
    }
  };

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

  return (
    <>
      <div className="space-y-6">
        {/* Success message for tier change */}
        {tierSuccess && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Resource tier updated successfully!
            </AlertDescription>
          </Alert>
        )}

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
                  {currentResource?.name || "Resource Overview"}
                </h1>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNameEdit}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-muted-foreground mt-1">
              {resourceType?.name || currentResource?.type || "Resource"} &bull;{" "}
              {currentResource?.resource_id}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Resource Info Card with Tier Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Resource Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">
                  {resourceType?.name || currentResource?.type || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Resource ID</p>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {currentResource?.resource_id || resourceId}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Tier</p>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsTierDialogOpen(true)}
                      className="h-7 text-xs"
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Change
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      currentResource?.sku === "free" ? "secondary" : "default"
                    }
                    className="capitalize"
                  >
                    {currentTier?.name || currentResource?.sku || "Unknown"}
                  </Badge>
                  {currentResource?.sku === "free" && canEdit && (
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => setIsTierDialogOpen(true)}
                      className="h-auto p-0 text-xs"
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <ResourceStatusBadge status={currentResource?.status} />
              </div>
              {currentResource?.error_message && (
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Error Message
                  </p>
                  <p className="text-sm text-red-500">
                    {currentResource.error_message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentResource?.created_at && (
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentResource.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {currentResource?.updated_at && (
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentResource.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resource-type-specific details panel */}
        {currentResource && <ResourceDetailsPanel resource={currentResource} />}

        {/* Danger Zone for resource deletion */}
        <Card className="border-destructive mt-8">
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
                <p className="font-medium">Delete this resource</p>
                <p className="text-sm text-muted-foreground">
                  Once you delete a resource, there is no going back. All data
                  will be permanently deleted.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="ml-4"
              >
                Delete Resource
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Resource Dialog */}
      {currentResource && (
        <DeleteResourceDialog
          resourceName={currentResource.name}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteResource}
          isDeleting={isDeleting}
        />
      )}
      {/* Error alert for deletion */}
      {deleteError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}
      {/* Tier Change Dialog */}
      {currentResource && (
        <ResourceTierChangeDialog
          resource={currentResource}
          open={isTierDialogOpen}
          onOpenChange={setIsTierDialogOpen}
          onConfirm={handleTierChange}
        />
      )}
    </>
  );
}
