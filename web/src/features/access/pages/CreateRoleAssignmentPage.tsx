import { useCallback, useState, useEffect } from "react";
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
import { AccessControlContextType } from "../types";
import { useRoles, useInviteUser } from "../hooks/useAccessApi";

const CreateRoleAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const { context, setContext } = useAccessStore();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const inviteUserMutation = useInviteUser(context);

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
            <div className="grid gap-3">
              {rolesLoading ? (
                <div className="text-center py-4">Loading roles...</div>
              ) : (
                roles.map((role) => (
                  <Card
                    key={role.role_id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedRoleId === role.role_id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedRoleId(role.role_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="role"
                              value={role.role_id}
                              checked={selectedRoleId === role.role_id}
                              onChange={() => setSelectedRoleId(role.role_id)}
                              className="h-4 w-4"
                            />
                            <h4 className="font-medium">{role.display_name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        </div>
                        {currentContext && (
                          <RolePermissionsTooltip
                            role={role}
                            scopeType={currentContext.scopeType}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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
