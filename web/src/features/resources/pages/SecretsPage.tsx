import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Filter,
  Trash2,
  Key,
} from "lucide-react";
import { useResources, useDeleteResource } from "../hooks/useResourceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceStatusBadge } from "../components/ResourceStatusBadge";
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import { useMultipleResourcePermissions } from "@/features/access/hooks/useMultipleResourcePermissions";
import { DeleteResourceDialog } from "../components/DeleteResourceDialog";

export default function SecretsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  // Fetch all resources, client-side filter
  const {
    data: allResources = [],
    isLoading,
    error,
    refetch,
  } = useResources(projectId!);

  // FILTER ONLY SECRETS
  const resources = useMemo(
    () => allResources.filter((r) => r.type === "Konnektr.Secret"),
    [allResources]
  );

  const resourceIds = useMemo(
    () => resources.map((r) => r.resource_id),
    [resources]
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteResourceMutation = useDeleteResource(
    projectId!,
    deletingId ?? ""
  );
  const { permissionsMap, loadingMap } =
    useMultipleResourcePermissions(resourceIds);
  // Permissions for project (for create)
  const { data: projectPermissions = [] } = useUserPermissions(
    "project",
    projectId ?? ""
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const resourceToDelete = resources.find((r) => r.resource_id === deletingId);

  const handleDelete = async () => {
    if (deletingId && projectId) {
      await deleteResourceMutation.mutateAsync();
      setDeletingId(null);
      setShowConfirm(false);
      refetch();
    }
  };
  const [filter, setFilter] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      refetch();
      intervalRef.current = setInterval(() => {
        refetch();
      }, 10000); // 10 seconds
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId, refetch]);

  if (isLoading) {
    return <div>Loading secrets...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error: {error.message || String(error)}
      </div>
    );
  }

  // Filtering logic
  const filteredResources = filter
    ? resources.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(filter.toLowerCase())
      )
    : resources;

  const handleCreateSecret = () => {
    // Pre-select Secret type and navigate to create page
    navigate(
      `/projects/${projectId}/resources/create?resource_type=Konnektr.Secret&sku=standard`
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Secrets ({resources.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Filter secrets..."
                  className="w-48 pl-8"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {projectPermissions?.includes("write") && (
                <Button onClick={handleCreateSecret}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Secret
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Manage your secure credentials and secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No secrets found. Create your first secret!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => {
                    const resourcePermissions =
                      permissionsMap[resource.resource_id] || [];
                    const resourcePermLoading =
                      loadingMap[resource.resource_id] || false;
                    const canDelete = resourcePermissions.includes("delete");
                    return (
                      <TableRow
                        key={resource.resource_id}
                        className="hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          if (!showConfirm) {
                            navigate(
                              `/projects/${projectId}/resources/${resource.resource_id}`
                            );
                          }
                        }}
                      >
                        <TableCell className="p-2 pl-4 align-middle whitespace-nowrap h-full">
                          <div className="flex items-center gap-2 h-full">
                            <Key className="h-4 w-4 text-primary" />
                            <span className="font-medium">{resource.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>
                          <ResourceStatusBadge status={resource.status} />
                        </TableCell>
                        <TableCell>
                          {resource.created_at.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/projects/${projectId}/resources/${resource.resource_id}`
                              );
                            }}
                          >
                            View
                          </Button>
                          {/* Show delete button only if user has resource-level delete permission */}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              title="Delete secret"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(resource.resource_id);
                                setShowConfirm(true);
                              }}
                              disabled={resourcePermLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        {/* Delete confirmation dialog */}
                        {showConfirm && resourceToDelete && (
                          <DeleteResourceDialog
                            resourceName={resourceToDelete.name}
                            open={showConfirm}
                            onOpenChange={(open) => {
                              setShowConfirm(open);
                              if (!open) setDeletingId(null);
                            }}
                            onConfirm={handleDelete}
                            isDeleting={
                              deleteResourceMutation.status === "pending"
                            }
                          />
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
