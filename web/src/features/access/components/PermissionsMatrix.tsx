import { Role } from '../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface PermissionsMatrixProps {
  roles: Role[];
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
    { action: 'write', label: 'Edit Project', description: 'Modify project settings and create resources' },
    { action: 'manage_access', label: 'Manage Access', description: 'Control who has access to the project' },
    { action: 'delete', label: 'Delete Project', description: 'Delete the project and all its resources' },
  ],
  resource: [
    { action: 'read', label: 'View Resource', description: 'View resource details, logs, and status' },
    { action: 'write', label: 'Edit Resource', description: 'Modify resource configuration and settings' },
    { action: 'manage_access', label: 'Manage Access', description: 'Control who has access to the resource' },
    { action: 'delete', label: 'Delete Resource', description: 'Delete the resource (irreversible)' },
  ],
};

// Define role permissions (this should eventually come from the backend)
const ROLE_PERMISSIONS = {
  Owner: ['read', 'write', 'manage_access', 'manage_billing', 'delete'],
  Editor: ['read', 'write'],
  Viewer: ['read'],
};

export default function PermissionsMatrix({ roles, scopeType }: PermissionsMatrixProps) {
  const permissions = PERMISSIONS[scopeType];
  const filteredRoles = roles.filter(role => ['Owner', 'Editor', 'Viewer'].includes(role.name));

  const hasPermission = (roleName: string, action: string): boolean => {
    return ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS]?.includes(action) || false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions Matrix</CardTitle>
        <CardDescription>
          Overview of what each role can do in this {scopeType}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Permission</TableHead>
              {filteredRoles.map((role) => (
                <TableHead key={role.role_id} className="text-center">
                  <Badge variant="outline">{role.display_name}</Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.action}>
                <TableCell>
                  <div>
                    <div className="font-medium">{permission.label}</div>
                    <div className="text-sm text-muted-foreground">{permission.description}</div>
                  </div>
                </TableCell>
                {filteredRoles.map((role) => (
                  <TableCell key={role.role_id} className="text-center">
                    {hasPermission(role.name, permission.action) ? (
                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 mx-auto" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
