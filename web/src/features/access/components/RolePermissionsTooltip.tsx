import { Role } from "../types/access.types";
import { useRolePermissions } from "../hooks/useAccessApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RolePermissionsTooltipProps {
  role: Role;
  scopeType: "organization" | "project" | "resource";
}

// Define permissions for each scope type

export default function RolePermissionsTooltip({
  role,
}: RolePermissionsTooltipProps) {
  const { data: permissions = [], isLoading } = useRolePermissions(
    role.role_id
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Badge variant="outline">{role.display_name}</Badge>
            <Info className="h-3 w-3 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-80 p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">{role.display_name}</h4>
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Permissions:</h5>
              <div className="space-y-1">
                {isLoading ? (
                  <div className="text-xs text-muted-foreground">
                    Loading...
                  </div>
                ) : permissions.length > 0 ? (
                  permissions.map(
                    (permission: {
                      permission_id: string;
                      action: string;
                      description: string;
                    }) => (
                      <div
                        key={permission.permission_id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="flex-1">{permission.action}</span>
                        <span className="text-muted-foreground">
                          {permission.description}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No permissions found for this role.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
