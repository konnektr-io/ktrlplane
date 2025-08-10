import { useEffect, useState } from 'react';
import { useAccessStore } from '../store/accessStore';
import { AccessControlContextType, RoleAssignment } from '../types';
import PermissionsMatrix from './PermissionsMatrix';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  MoreVertical,
  Users,
  Shield,
  Calendar,
  Mail,
  UserX,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AccessControlProps {
  context: AccessControlContextType;
}

export default function AccessControl({ context }: AccessControlProps) {
  const {
    roleAssignments,
    roles,
    isLoading,
    isInviting,
    isUpdating,
    setContext,
    inviteUser,
    updateUserRole,
    removeUser,
  } = useAccessStore();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState('');

  const [editingAssignment, setEditingAssignment] = useState<RoleAssignment | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

  useEffect(() => {
    setContext(context);
  }, [context, setContext]);

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await inviteUser(inviteEmail, inviteRole);
      toast.success('User invited successfully');
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('');
      setInviteExpiry('');
    } catch (error) {
      toast.error('Failed to invite user');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingAssignment || !editRole) {
      toast.error('Please select a role');
      return;
    }

    try {
      await updateUserRole(editingAssignment.assignment_id, editRole);
      toast.success('User role updated successfully');
      setEditingAssignment(null);
      setEditRole('');
      setEditExpiry('');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleRemoveUser = async (assignment: RoleAssignment) => {
    if (!confirm(`Are you sure you want to remove ${assignment.user?.name || assignment.user?.email} from this ${context.scopeType}?`)) {
      return;
    }

    try {
      await removeUser(assignment.assignment_id);
      toast.success('User removed successfully');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const openEditDialog = (assignment: RoleAssignment) => {
    setEditingAssignment(assignment);
    setEditRole(assignment.role?.name || '');
    setEditExpiry(assignment.expires_at ? assignment.expires_at.split('T')[0] : '');
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'Owner':
        return 'bg-red-100 text-red-800';
      case 'Editor':
        return 'bg-blue-100 text-blue-800';
      case 'Viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Access & Permissions</h1>
            <p className="text-muted-foreground">
              Manage who has access to this {context.scopeType}: {context.scopeName}
            </p>
          </div>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Invite a user to access this {context.scopeType}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={role.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiry">Access Expires (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={inviteExpiry}
                  onChange={(e) => setInviteExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={isInviting}>
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Members ({roleAssignments.length})</span>
          </CardTitle>
          <CardDescription>
            Users with access to this {context.scopeType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : roleAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              <p className="text-sm">Invite users to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleAssignments.map((assignment) => (
                  <TableRow key={assignment.assignment_id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {assignment.user?.name?.charAt(0) || assignment.user?.email.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {assignment.user?.name || assignment.user?.email}
                          </div>
                          {assignment.user?.name && (
                            <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{assignment.user.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getRoleColor(assignment.role?.name || '')}>
                          {assignment.role?.display_name}
                        </Badge>
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
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.expires_at ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span
                            className={`text-sm ${
                              isExpired(assignment.expires_at)
                                ? 'text-red-600'
                                : isExpiringSoon(assignment.expires_at)
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(assignment.expires_at), 'MMM d, yyyy')}
                          </span>
                          {isExpired(assignment.expires_at) && (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          )}
                          {isExpiringSoon(assignment.expires_at) && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
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
                              <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveUser(assignment)}
                                className="text-red-600"
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

      {/* Permissions Matrix */}
      <PermissionsMatrix roles={roles} scopeType={context.scopeType} />

      {/* Edit Role Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role and access expiry for {editingAssignment?.user?.name || editingAssignment?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.role_id} value={role.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-expiry">Access Expires (Optional)</Label>
              <Input
                id="edit-expiry"
                type="date"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAssignment(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
