import { useEffect, useState, useMemo } from "react";
import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { useResourceStore } from "../store/resourceStore";
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
import {
  PlusCircle,
  Database,
  Server,
  Globe,
  FileText,
  Filter,
  Trash2,
} from "lucide-react";
import { useUserPermissions } from "@/features/access/hooks/useUserPermissions";
import { useMultipleResourcePermissions } from "@/features/access/hooks/useMultipleResourcePermissions";

const resourceTypeIcons = {
  Database: Database,
  API: Server,
  Website: Globe,
  Service: Server,
  Storage: FileText,
} as const;

export default function ResourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    data: resources = [],
    isLoading,
    error,
    refetch,
  } = useResources(projectId!);
  const resourceIds = useMemo(() => resources.map((r) => r.resource_id), [resources]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteResourceMutation = useDeleteResource(projectId!, deletingId ?? "");
  const { permissionsMap, loadingMap } = useMultipleResourcePermissions(resourceIds);
  // Permissions for project (for create)
  const { permissions: projectPermissions } = useUserPermissions("project", projectId);
  const [showConfirm, setShowConfirm] = useState(false);
  const resourceToDelete = resources.find((r) => r.resource_id === deletingId);

  // Resource-level permissions will be handled via state and effect below
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
    return <div>Loading resources...</div>;
  }

  if (error) {
     return <div className="text-red-500">Error: {error.message || String(error)}</div>;
  }

  // Filtering logic
  const filteredResources = filter
    ? resources.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(filter.toLowerCase()) ||
          (r.type || "").toLowerCase().includes(filter.toLowerCase())
      )
    : resources;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Resources ({resources.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Filter resources..."
                  className="w-48 pl-8"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {projectPermissions?.includes("write") && (
                <Button
                  onClick={() =>
                    navigate(`/projects/${projectId}/resources/create`)
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Resource
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Manage your project resources and their configurations
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
                      No resources found. Create your first resource!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => {
                    const IconComponent =
                      resourceTypeIcons[
                        resource.type as keyof typeof resourceTypeIcons
                      ] || Server;
                    // Use new hook for per-resource permissions
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
                            <IconComponent className="h-4 w-4 text-primary" />
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
                            Configure
                          </Button>
                          {/* Show delete button only if user has resource-level delete permission */}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              title="Delete resource"
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
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
                              <h2 className="text-lg font-semibold mb-2">
                                Delete Resource
                              </h2>
                              <p className="mb-4">
                                Are you sure you want to delete{" "}
                                <span className="font-bold">
                                  {resourceToDelete.name}
                                </span>
                                ? This action cannot be undone.
                              </p>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowConfirm(false);
                                    setDeletingId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDelete}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
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
