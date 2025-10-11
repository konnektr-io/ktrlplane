package db

// Query constants for database operations.
const (
	// CreateUserQuery inserts a new user into the users table.
		CreateUserQuery = `
		INSERT INTO ktrlplane.users (user_id, email, name, external_auth_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())`

	// CreateOrganizationQuery inserts a new organization into the organizations table.
		CreateOrganizationQuery = `
		INSERT INTO ktrlplane.organizations (org_id, name, created_at)
		VALUES ($1, $2, NOW())`

	// CreateProjectQuery inserts a new project into the projects table.
		CreateProjectQuery = `
		INSERT INTO ktrlplane.projects (project_id, org_id, name, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Active', NOW(), NOW())`

	// GetProjectByIDQuery selects a project by its ID.
		GetProjectByIDQuery = `
		SELECT project_id, org_id, name, description, status, created_at, updated_at FROM ktrlplane.projects WHERE project_id = $1`

	// ListProjectsQuery selects all projects.
		ListProjectsQuery = `
		SELECT project_id, org_id, name, description, status, created_at, updated_at FROM ktrlplane.projects`

	// UpdateProjectQuery updates a project's name and description.
		UpdateProjectQuery = `
		UPDATE ktrlplane.projects SET name = $2, description = $3, updated_at = NOW() WHERE project_id = $1`

	// DeleteProjectQuery marks a project as deleting.
		DeleteProjectQuery = `
		UPDATE ktrlplane.projects SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1`

	// GetOrganizationsForUserQuery selects organizations for a user.
		GetOrganizationsForUserQuery = `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at 
		FROM ktrlplane.organizations o
		INNER JOIN ktrlplane.role_assignments ra ON ra.scope_type = 'organization' AND ra.scope_id = o.org_id
		WHERE ra.user_id = $1`

	// AssignRoleQuery inserts a new role assignment.
		AssignRoleQuery = `
		INSERT INTO ktrlplane.role_assignments (user_id, role_name, scope_type, scope_id, assigned_by, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())`

	// CheckPermissionQuery checks if a user has a permission.
		CheckPermissionQuery = `
		SELECT COUNT(*) FROM ktrlplane.role_assignments ra
		INNER JOIN ktrlplane.role_permissions rp ON ra.role_name = rp.role_name
		INNER JOIN ktrlplane.permissions p ON rp.permission_name = p.permission_name
		WHERE ra.user_id = $1 
		AND p.resource_type = $2 
		AND p.action = $3
		AND (
			-- Direct scope match
			(ra.scope_type = $4 AND ra.scope_id = $5) OR
			-- Inherited from organization (if checking project/resource)
			(ra.scope_type = 'organization' AND $4 IN ('project', 'resource') AND ra.scope_id = $6) OR
			-- Inherited from project (if checking resource)
			(ra.scope_type = 'project' AND $4 = 'resource' AND ra.scope_id = $7)
		)`

	// CreateResourceQuery inserts a new resource into the resources table.
		CreateResourceQuery = `
		INSERT INTO ktrlplane.resources (resource_id, project_id, name, type, status, settings_json, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Creating', $5, NOW(), NOW())`

	// GetResourceByIDQuery selects a resource by its ID.
		GetResourceByIDQuery = `
		SELECT resource_id, project_id, name, type, status, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`

	// ListResourcesQuery selects all resources for a project.
		ListResourcesQuery = `
		SELECT resource_id, project_id, name, type, status, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1`

	// UpdateResourceQuery updates a resource's name and settings.
		UpdateResourceQuery = `
		UPDATE ktrlplane.resources SET name = $3, settings_json = $4, status = 'Updating', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	// DeleteResourceQuery marks a resource as deleting.
		DeleteResourceQuery = `
		UPDATE ktrlplane.resources SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	// CreateOrganizationWithTimestampsQuery inserts an organization and returns timestamps.
		CreateOrganizationWithTimestampsQuery = `
		INSERT INTO ktrlplane.organizations (org_id, name, created_at, updated_at) 
		VALUES ($1, $2, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	// CreateProjectWithTimestampsQuery inserts a project and returns timestamps.
		CreateProjectWithTimestampsQuery = `
		INSERT INTO ktrlplane.projects (project_id, org_id, name, description, status, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	// GetRoleIDByNameQuery selects a role ID by name.
		GetRoleIDByNameQuery = `
		SELECT role_id FROM ktrlplane.roles WHERE name = $1`

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

	// GetOrganizationsForUserAdvancedQuery selects organizations for a user with advanced logic.
		GetOrganizationsForUserAdvancedQuery = `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at
		FROM ktrlplane.organizations o
		JOIN ktrlplane.role_assignments ra ON ra.scope_id = o.org_id AND ra.scope_type = 'organization'
		WHERE ra.user_id = $1
		  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		ORDER BY o.name`

	// GetOrganizationByIDQuery selects an organization by its ID.
		GetOrganizationByIDQuery = `
		SELECT org_id, name, created_at, updated_at 
		FROM ktrlplane.organizations 
		WHERE org_id = $1`

	// ListProjectsForUserQuery selects projects for a user.
		ListProjectsForUserQuery = `
		SELECT DISTINCT p.project_id, p.org_id, p.name, p.description, p.status, p.created_at, p.updated_at
		FROM ktrlplane.projects p
		LEFT JOIN ktrlplane.role_assignments ra_proj ON ra_proj.scope_id = p.project_id AND ra_proj.scope_type = 'project'
		LEFT JOIN ktrlplane.role_assignments ra_org ON ra_org.scope_id = p.org_id AND ra_org.scope_type = 'organization'
		WHERE (ra_proj.user_id = $1 OR ra_org.user_id = $1)
		ORDER BY p.name`

	// CheckUserExistsQuery checks if a user exists.
		CheckUserExistsQuery = `
		SELECT user_id 
		FROM ktrlplane.users 
		WHERE user_id = $1`

	// GetUserByIDQuery selects a user by ID.
		GetUserByIDQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users 
		WHERE user_id = $1`

	// UpdateUserEmailQuery updates a user's email.
		UpdateUserEmailQuery = `
		UPDATE ktrlplane.users 
		SET email = $2 
		WHERE user_id = $1`

	// UpdateUserNameQuery updates a user's name.
		UpdateUserNameQuery = `
		UPDATE ktrlplane.users 
		SET name = $2 
		WHERE user_id = $1`

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

	// SearchUsersQuery searches for users by email, name, or user ID.
		SearchUsersQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users
		WHERE LOWER(email) LIKE LOWER($1)
			OR LOWER(name) LIKE LOWER($1)
			OR LOWER(user_id) LIKE LOWER($1)
		ORDER BY email
		LIMIT 10`

	// DeleteRoleAssignmentQuery deletes a role assignment by assignment ID, scope type, and scope ID.
		DeleteRoleAssignmentQuery = `
		DELETE FROM role_assignments
		WHERE assignment_id = $1`
)
