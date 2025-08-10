import { Role } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Check, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RolePermissionsTooltipProps {
  role: Role;
  scopeType: 'organization' | 'project' | 'resource';
}

// Define permissions for each scope type
const PERMISSIONS = {
  organization: [
    { action: 'read', label: 'View Organization', description: 'View organization details and settings' },
    { action: 'write', label: 'Edit Organization', description: 'Modify organization details and settings' },
    { action: 'manage_access', label: 'Manage Members', description: 'Invite, remove, and manage member roles' },
    { action: 'manage_billing', label: 'Manage Billing', description: 'View and manage billing information' },
    { action: 'delete', label: 'Delete Organization', description: 'Delete the organization (irreversible)' },
  ],
  project: [
    { action: 'read', label: 'View Project', description: 'View project details and resources' },
    { action: 'write', label: 'Edit Project', description: 'Modify project details and settings' },
    { action: 'manage_access', label: 'Manage Members', description: 'Invite, remove, and manage member roles' },
    { action: 'create_resources', label: 'Create Resources', description: 'Create new resources in the project' },
    { action: 'delete', label: 'Delete Project', description: 'Delete the project (irreversible)' },
  ],
  resource: [
    { action: 'read', label: 'View Resource', description: 'View resource details and configurations' },
    { action: 'write', label: 'Edit Resource', description: 'Modify resource configurations' },
    { action: 'manage_access', label: 'Manage Access', description: 'Manage resource-specific permissions' },
    { action: 'deploy', label: 'Deploy', description: 'Deploy and manage resource deployments' },
    { action: 'delete', label: 'Delete Resource', description: 'Delete the resource (irreversible)' },
  ],
};

// Define role permissions (this should eventually come from the backend)
const ROLE_PERMISSIONS = {
  Owner: ['read', 'write', 'manage_access', 'manage_billing', 'create_resources', 'deploy', 'delete'],
  Editor: ['read', 'write', 'create_resources', 'deploy'],
  Viewer: ['read'],
};

export default function RolePermissionsTooltip({ role, scopeType }: RolePermissionsTooltipProps) {
  const permissions = PERMISSIONS[scopeType];

  const hasPermission = (roleName: string, action: string): boolean => {
    return ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS]?.includes(action) || false;
  };

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
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Permissions:</h5>
              <div className="space-y-1">
                {permissions.map((permission) => (
                  <div key={permission.action} className="flex items-center gap-2 text-xs">
                    {hasPermission(role.name, permission.action) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="flex-1">{permission.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
