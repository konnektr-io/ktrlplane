import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessStore } from '../store/accessStore';
import { AccessControlContextType, RoleAssignment } from '../types';
import RolePermissionsTooltip from './RolePermissionsTooltip';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  UserX,
  Calendar,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface AccessControlProps {
  context: AccessControlContextType;
}


export default function AccessControl({ context }: AccessControlProps) {
  const navigate = useNavigate();
  const {
    roleAssignments,
    isLoading,
    isUpdating,
    setContext,
    removeUser,
  } = useAccessStore();

  const [removeConfirmation, setRemoveConfirmation] = useState<RoleAssignment | null>(null);

  useEffect(() => {
    setContext(context);
  }, [context, setContext]);
  
  // Filter state for members
  const [filter, setFilter] = useState("");
  const filteredAssignments = filter
    ? roleAssignments.filter(a =>
        (a.user?.name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (a.user?.email || "").toLowerCase().includes(filter.toLowerCase())
      )
    : roleAssignments;

  const handleRemoveUser = async (assignment: RoleAssignment) => {
    try {
      await removeUser(assignment.assignment_id);
      toast.success('User access removed successfully');
      setRemoveConfirmation(null);
    } catch (error) {
      toast.error('Failed to remove user access');
    }
  };

  const getCreateAccessUrl = () => {
    switch (context.scopeType) {
      case 'organization':
        return `/organizations/${context.scopeId}/access/grant`;
      case 'project':
        return `/projects/${context.scopeId}/access/grant`;
      case 'resource':
        // Need to extract project ID for resource routes
        const currentPath = window.location.pathname;
        const projectMatch = currentPath.match(/\/project\/([^\/]+)/);
        const projectId = projectMatch ? projectMatch[1] : '';
        return `/projects/${projectId}/resources/${context.scopeId}/access/grant`;
      default:
        return '#';
    }
  };

  const formatExpiryDate = (expiresAt?: string) => {
    if (!expiresAt) return 'Never';
    return new Date(expiresAt).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access & Permissions</h2>
          <p className="text-muted-foreground">
            Manage who has access to this {context.scopeType} and what they can do
          </p>
        </div>
        <Button onClick={() => navigate(getCreateAccessUrl())} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Grant Access
        </Button>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Role assignments ({roleAssignments.length})</span>
            </CardTitle>
            {/* Filter input */}
            <input
              type="text"
              placeholder="Filter members..."
              className="input input-sm border rounded px-2 py-1 text-sm w-48"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ minWidth: 0 }}
            />
          </div>
          <CardDescription>
            Users with role assignments for this {context.scopeType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No role assignments yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by granting access to users for this {context.scopeType}
              </p>
              <Button onClick={() => navigate(getCreateAccessUrl())} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Grant Access
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.assignment_id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {assignment.user?.name || assignment.user?.email || 'Unknown User'}
                          </div>
                          {assignment.user?.name && (
                            <div className="text-sm text-muted-foreground">
                              {assignment.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {assignment.role ? (
                          <RolePermissionsTooltip 
                            role={assignment.role} 
                            scopeType={context.scopeType} 
                          />
                        ) : (
                          <Badge variant="outline">Unknown Role</Badge>
                        )}
                        {assignment.inheritance_type === 'inherited' && (
                          <div className="text-xs text-muted-foreground flex items-center space-x-1">
                            <span className="text-blue-600 font-medium">
                              Inherited from {assignment.inherited_from_scope_type}
                            </span>
                            {assignment.inherited_from_name && (
                              <span>({assignment.inherited_from_name})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatExpiryDate(assignment.expires_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {assignment.inheritance_type === 'direct' ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => setRemoveConfirmation(assignment)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Access
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem disabled>
                              <div className="text-sm text-muted-foreground">
                                Inherited permissions can only be managed from {assignment.inherited_from_scope_type}
                              </div>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeConfirmation} onOpenChange={() => setRemoveConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeConfirmation?.user?.name || removeConfirmation?.user?.email}'s 
              access to this {context.scopeType}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeConfirmation && handleRemoveUser(removeConfirmation)}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Removing...' : 'Remove Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
