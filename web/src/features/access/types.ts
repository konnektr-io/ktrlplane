export interface User {
  id: string;
  email: string;
  name?: string;
  roles?: Role[];
}

export interface Role {
  role_id: string;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  permission_id: string;
  resource_type: string;
  action: string;
  description: string;
  created_at: string;
}

export interface RoleAssignment {
  assignment_id: string;
  user_id: string;
  role_id: string;
  scope_type: 'organization' | 'project' | 'resource';
  scope_id: string;
  assigned_by: string;
  created_at: string;
  expires_at?: string;
  // Populated fields
  user?: User;
  role?: Role;
  // Inheritance information
  inheritance_type: 'direct' | 'inherited';
  inherited_from_scope_type?: 'organization' | 'project';
  inherited_from_scope_id?: string;
  inherited_from_name?: string;
}

export interface AccessControlContextType {
  scopeType: 'organization' | 'project' | 'resource';
  scopeId: string;
  scopeName: string;
}

export interface InviteUserRequest {
  email: string;
  role_name: string;
}

export interface UpdateRoleRequest {
  assignment_id: string;
  role_name: string;
}
