package db

// Role-related SQL queries
const (
	// GetAllRolesQuery returns all roles in the system ordered by display_order
	GetAllRolesQuery = `
		SELECT role_id, name, display_name, description, is_system, created_at, updated_at
		FROM ktrlplane.roles
		ORDER BY display_order ASC, display_name ASC;`

	// GetPermissionsForRoleQuery returns all permissions associated with a specific role
	GetPermissionsForRoleQuery = `
		SELECT p.permission_id, p.resource_type, p.action, p.description, p.created_at
		FROM ktrlplane.role_permissions rp
		JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
		WHERE rp.role_id = $1;`

	// AssignRoleWithTransactionQuery inserts a role assignment within a transaction.
	AssignRoleWithTransactionQuery = `
		INSERT INTO ktrlplane.role_assignments (assignment_id, user_id, role_id, scope_type, scope_id, assigned_by, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
		ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING`

	// AllPermissionsWithInheritanceCTE is the base CTE for permission inheritance logic.
	AllPermissionsWithInheritanceCTE = `
			WITH all_permissions AS (
				-- Direct permissions on the requested scope
				SELECT DISTINCT p.action
				FROM ktrlplane.role_assignments ra
				JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
				JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
				WHERE ra.user_id = $1
				  AND p.resource_type = 'Konnektr.KtrlPlane'
				  AND ra.scope_type = $2
				  AND ra.scope_id = $3
				  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())

				UNION

				-- Inherited permissions from organization (if checking project/resource)
				SELECT DISTINCT p.action
				FROM ktrlplane.role_assignments ra
				JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
				JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
				JOIN ktrlplane.projects proj ON proj.project_id = $3 -- if scopeType is project
				WHERE ra.user_id = $1
				  AND p.resource_type = 'Konnektr.KtrlPlane'
				  AND ra.scope_type = 'organization'
				  AND ra.scope_id = proj.org_id
				  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
				  AND $2 = 'project'

				UNION

				-- Inherited permissions from project (if checking resource)
				SELECT DISTINCT p.action
				FROM ktrlplane.role_assignments ra
				JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
				JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
				JOIN ktrlplane.resources res ON res.resource_id = $3 -- if scopeType is resource
				WHERE ra.user_id = $1
				  AND p.resource_type = 'Konnektr.KtrlPlane'
				  AND ra.scope_type = 'project'
				  AND ra.scope_id = res.project_id
				  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
				  AND $2 = 'resource'

				UNION

				-- Inherited permissions from organization (if checking resource)
				SELECT DISTINCT p.action
				FROM ktrlplane.role_assignments ra
				JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
				JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
				JOIN ktrlplane.resources res ON res.resource_id = $3 -- if scopeType is resource
				JOIN ktrlplane.projects proj ON proj.project_id = res.project_id
				WHERE ra.user_id = $1
				  AND p.resource_type = 'Konnektr.KtrlPlane'
				  AND ra.scope_type = 'organization'
				  AND ra.scope_id = proj.org_id
				  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
				  AND $2 = 'resource'
			)
		`

	// CheckPermissionWithInheritanceQuery checks a specific permission (action) with inheritance.
	CheckPermissionWithInheritanceQuery = AllPermissionsWithInheritanceCTE + `
		SELECT EXISTS(SELECT 1 FROM all_permissions WHERE action = $4) as has_permission`

	// ListPermissionsWithInheritanceQuery lists all permissions (actions) for a user/scope with inheritance.
	ListPermissionsWithInheritanceQuery = AllPermissionsWithInheritanceCTE + `
		SELECT DISTINCT action FROM all_permissions`

	// GetUserRolesQuery selects all roles assigned to a user.
	GetUserRolesQuery = `
		SELECT ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at
		FROM ktrlplane.role_assignments ra
		WHERE ra.user_id = $1
		  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		ORDER BY ra.created_at DESC`

	// GetRoleAssignmentsWithDetailsQuery selects role assignments with details.
	GetRoleAssignmentsWithDetailsQuery = `
		SELECT 
			ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at,
			r.name as role_name, r.display_name as role_display_name, r.description as role_description, r.is_system,
			u.email, u.name
		FROM ktrlplane.role_assignments ra
		JOIN ktrlplane.roles r ON ra.role_id = r.role_id
		JOIN ktrlplane.users u ON ra.user_id = u.user_id
		WHERE ra.scope_type = $1 AND ra.scope_id = $2
		  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		ORDER BY ra.created_at DESC`

	// GetRoleAssignmentsWithInheritanceQuery selects role assignments with inheritance.
	GetRoleAssignmentsWithInheritanceQuery = `
		WITH role_assignments_with_inheritance AS (
			-- Direct assignments to the specified scope
			SELECT 
				ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at,
				r.name as role_name, r.display_name as role_display_name, r.description as role_description, r.is_system,
				u.email, u.name,
				'direct' as inheritance_type,
				'' as inherited_from_scope_type,
				'' as inherited_from_scope_id,
				'' as inherited_from_name
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.roles r ON ra.role_id = r.role_id
			JOIN ktrlplane.users u ON ra.user_id = u.user_id
			WHERE ra.scope_type = $1 AND ra.scope_id = $2
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			
			UNION ALL
			
			-- Inherited assignments from project (when viewing resource)
			SELECT 
				ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at,
				r.name as role_name, r.display_name as role_display_name, r.description as role_description, r.is_system,
				u.email, u.name,
				'inherited' as inheritance_type,
				'project' as inherited_from_scope_type,
				res.project_id as inherited_from_scope_id,
				p.name as inherited_from_name
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.roles r ON ra.role_id = r.role_id
			JOIN ktrlplane.users u ON ra.user_id = u.user_id
			JOIN ktrlplane.resources res ON res.resource_id = $2
			JOIN ktrlplane.projects p ON p.project_id = res.project_id
			WHERE ra.scope_type = 'project' AND ra.scope_id = res.project_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $1 = 'resource'
			
			UNION ALL
			
			-- Inherited assignments from organization (when viewing resource)
			SELECT 
				ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at,
				r.name as role_name, r.display_name as role_display_name, r.description as role_description, r.is_system,
				u.email, u.name,
				'inherited' as inheritance_type,
				'organization' as inherited_from_scope_type,
				p.org_id as inherited_from_scope_id,
				o.name as inherited_from_name
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.roles r ON ra.role_id = r.role_id
			JOIN ktrlplane.users u ON ra.user_id = u.user_id
			JOIN ktrlplane.resources res ON res.resource_id = $2
			JOIN ktrlplane.projects p ON p.project_id = res.project_id
			JOIN ktrlplane.organizations o ON o.org_id = p.org_id
			WHERE ra.scope_type = 'organization' AND ra.scope_id = p.org_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $1 = 'resource'
			
			UNION ALL
			
			-- Inherited assignments from organization (when viewing project)
			SELECT 
				ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at,
				r.name as role_name, r.display_name as role_display_name, r.description as role_description, r.is_system,
				u.email, u.name,
				'inherited' as inheritance_type,
				'organization' as inherited_from_scope_type,
				p.org_id as inherited_from_scope_id,
				o.name as inherited_from_name
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.roles r ON ra.role_id = r.role_id
			JOIN ktrlplane.users u ON ra.user_id = u.user_id
			JOIN ktrlplane.projects p ON p.project_id = $2
			JOIN ktrlplane.organizations o ON o.org_id = p.org_id
			WHERE ra.scope_type = 'organization' AND ra.scope_id = p.org_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $1 = 'project'
		)
		SELECT * FROM role_assignments_with_inheritance
		ORDER BY inheritance_type ASC, created_at DESC`

	// DeleteRoleAssignmentQuery deletes a role assignment by assignment ID, scope type, and scope ID.
	DeleteRoleAssignmentQuery = `
		DELETE FROM role_assignments
		WHERE assignment_id = $1`
)
