import { useCallback, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import UserSelector from "../components/UserSelector";
import RolePermissionsTooltip from "../components/RolePermissionsTooltip";
import { useAccessStore } from "../store/accessStore";
import { AccessControlContextType } from "../types/access.types";
import { useRoles, useInviteUser } from "../hooks/useAccessApi";
import { sortRoles, getRoleCategory } from "../utils/roleHelpers";

const CreateRoleAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const { context, setContext } = useAccessStore();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const inviteUserMutation = useInviteUser(context);

  // Sort and group roles for better display
  const sortedRoles = useMemo(() => sortRoles(roles), [roles]);
  
  // Group roles by category
  const rolesByCategory = useMemo(() => {
    const groups = new Map<string, typeof sortedRoles>();
    sortedRoles.forEach(role => {
      const category = getRoleCategory(role);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(role);
    });
    return groups;
  }, [sortedRoles]);

  // Determine context from route
  const getContextFromRoute =
    useCallback((): AccessControlContextType | null => {
      if (params.projectId && params.resourceId) {
        // Resource context
        return {
          scopeType: "resource",
          scopeId: params.resourceId,
          scopeName: `Resource ${params.resourceId}`,
        };
      } else if (params.projectId) {
        // Project context
        return {
          scopeType: "project",
          scopeId: params.projectId,
          scopeName: `Project ${params.projectId}`,
        };
      } else if (params.orgId) {
        // Organization context
        return {
          scopeType: "organization",
          scopeId: params.orgId,
          scopeName: `Organization ${params.orgId}`,
        };
      }
      return null;
    }, [params]);

  useEffect(() => {
    const context = getContextFromRoute();
    if (context) {
      setContext(context);
    }
  }, [params, setContext, getContextFromRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !selectedRoleId) {
      toast.error("Please select both a user and a role");
      return;
    }

    inviteUserMutation.mutate(
      { userId: selectedUser, roleName: selectedRoleId },
      {
        onSuccess: () => {
          toast.success("User access granted successfully");
          // Navigate back to access page
          const context = getContextFromRoute();
          if (context) {
            switch (context.scopeType) {
              case "project":
                navigate(`/projects/${context.scopeId}/access`);
                break;
              case "resource":
                navigate(
                  `/projects/${params.projectId}/resources/${context.scopeId}/access`
                );
                break;
              case "organization":
                navigate(`/organizations/${context.scopeId}/access`);
                break;
            }
          }
        },
        onError: () => {
          toast.error("Failed to grant access");
        },
      }
    );
  };

  const getPageTitle = () => {
    const context = getContextFromRoute();
    if (!context) return "Grant Access";

    switch (context.scopeType) {
      case "project":
        return "Grant Project Access";
      case "resource":
        return "Grant Resource Access";
      case "organization":
        return "Grant Organization Access";
      default:
        return "Grant Access";
    }
  };

  const currentContext = getContextFromRoute();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        <p className="text-muted-foreground">
          Grant a user access to this {currentContext?.scopeType || "resource"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>
              Choose an existing user or invite a new one by email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserSelector
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="Search for a user or enter email..."
            />
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Role</CardTitle>
            <CardDescription>
              Choose the level of access for this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="text-center py-4">Loading roles...</div>
            ) : (
              <div className="space-y-4">
                {Array.from(rolesByCategory.entries()).map(([category, categoryRoles]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {category}
                    </h3>
                    <div className="grid gap-2">
                      {categoryRoles.map((role) => (
                        <div
                          key={role.role_id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                            selectedRoleId === role.role_id
                              ? "ring-2 ring-primary bg-accent"
                              : ""
                          }`}
                          onClick={() => setSelectedRoleId(role.role_id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="radio"
                              name="role"
                              value={role.role_id}
                              checked={selectedRoleId === role.role_id}
                              onChange={() => setSelectedRoleId(role.role_id)}
                              className="h-4 w-4 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {role.display_name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {role.description}
                              </div>
                            </div>
                          </div>
                          {currentContext && (
                            <div className="flex-shrink-0 ml-2">
                              <RolePermissionsTooltip
                                role={role}
                                scopeType={currentContext.scopeType}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={
              !selectedUser || !selectedRoleId || inviteUserMutation.isPending
            }
            className="flex-1"
          >
            {inviteUserMutation.isPending
              ? "Granting Access..."
              : "Grant Access"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoleAssignmentPage;
