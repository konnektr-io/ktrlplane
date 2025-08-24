package db

const (
	// --- User Queries ---
	CreateUserQuery = `
		INSERT INTO ktrlplane.users (user_id, email, name, external_auth_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())`

	// --- Organization Queries ---
	CreateOrganizationQuery = `
		INSERT INTO ktrlplane.organizations (org_id, name, created_at)
		VALUES ($1, $2, NOW())`

	// --- Project Queries ---
	CreateProjectQuery = `
		INSERT INTO ktrlplane.projects (project_id, org_id, name, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Active', NOW(), NOW())`

	GetProjectByIDQuery = `
		SELECT project_id, org_id, name, description, status, created_at, updated_at FROM ktrlplane.projects WHERE project_id = $1`

	ListProjectsQuery = `
		SELECT project_id, org_id, name, description, status, created_at, updated_at FROM ktrlplane.projects`

	UpdateProjectQuery = `
		UPDATE ktrlplane.projects SET name = $2, description = $3, updated_at = NOW() WHERE project_id = $1`

	DeleteProjectQuery = `
		UPDATE ktrlplane.projects SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1`

	// --- RBAC Queries ---
	// Organization Queries
	GetOrganizationsForUserQuery = `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at 
		FROM ktrlplane.organizations o
		INNER JOIN ktrlplane.role_assignments ra ON ra.scope_type = 'organization' AND ra.scope_id = o.org_id
		WHERE ra.user_id = $1`

	// Role Assignment Queries
	AssignRoleQuery = `
		INSERT INTO ktrlplane.role_assignments (user_id, role_name, scope_type, scope_id, assigned_by, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())`

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

	// Resource Queries ---
	CreateResourceQuery = `
		INSERT INTO ktrlplane.resources (resource_id, project_id, name, type, status, settings_json, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Creating', $5, NOW(), NOW())`

	GetResourceByIDQuery = `
		SELECT * FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`

	ListResourcesQuery = `
		SELECT * FROM ktrlplane.resources WHERE project_id = $1`

	UpdateResourceQuery = `
		UPDATE ktrlplane.resources SET name = $3, settings_json = $4, status = 'Updating', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	DeleteResourceQuery = `
		UPDATE ktrlplane.resources SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	// --- Additional RBAC Queries ---
	CreateOrganizationWithTimestampsQuery = `
		INSERT INTO ktrlplane.organizations (org_id, name, created_at, updated_at) 
		VALUES ($1, $2, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	CreateProjectWithTimestampsQuery = `
		INSERT INTO ktrlplane.projects (project_id, org_id, name, description, status, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	GetRoleIDByNameQuery = `
		SELECT role_id FROM ktrlplane.roles WHERE name = $1`

	AssignRoleWithTransactionQuery = `
		INSERT INTO ktrlplane.role_assignments (assignment_id, user_id, role_id, scope_type, scope_id, assigned_by, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
		ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING`

	CheckPermissionWithInheritanceQuery = `
		WITH RECURSIVE permission_check AS (
			-- Direct permissions on the requested scope
			SELECT DISTINCT 1 as has_permission
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
			WHERE ra.user_id = $1
			  AND p.resource_type = 'Konnektr.KtrlPlane'
			  AND p.action = $2
			  AND ra.scope_type = $3
			  AND ra.scope_id = $4
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			
			UNION
			
			-- Inherited permissions from organization (if checking project/resource)
			SELECT DISTINCT 1 as has_permission
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
			JOIN ktrlplane.projects proj ON proj.project_id = $4 -- if scopeType is project
			WHERE ra.user_id = $1
			  AND p.resource_type = 'Konnektr.KtrlPlane'
			  AND p.action = $2
			  AND ra.scope_type = 'organization'
			  AND ra.scope_id = proj.org_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $3 = 'project'
			
			UNION
			
			-- Inherited permissions from project (if checking resource)
			SELECT DISTINCT 1 as has_permission
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
			JOIN ktrlplane.resources res ON res.resource_id = $4 -- if scopeType is resource
			WHERE ra.user_id = $1
			  AND p.resource_type = 'Konnektr.KtrlPlane'
			  AND p.action = $2
			  AND ra.scope_type = 'project'
			  AND ra.scope_id = res.project_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $3 = 'resource'
			
			UNION
			
			-- Inherited permissions from organization (if checking resource)
			SELECT DISTINCT 1 as has_permission
			FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions p ON rp.permission_id = p.permission_id
			JOIN ktrlplane.resources res ON res.resource_id = $4 -- if scopeType is resource
			JOIN ktrlplane.projects proj ON proj.project_id = res.project_id
			WHERE ra.user_id = $1
			  AND p.resource_type = 'Konnektr.KtrlPlane'
			  AND p.action = $2
			  AND ra.scope_type = 'organization'
			  AND ra.scope_id = proj.org_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			  AND $3 = 'resource'
		)
		SELECT EXISTS(SELECT 1 FROM permission_check) as has_permission`

	GetUserRolesQuery = `
		SELECT ra.assignment_id, ra.user_id, ra.role_id, ra.scope_type, ra.scope_id, ra.assigned_by, ra.created_at, ra.expires_at
		FROM ktrlplane.role_assignments ra
		WHERE ra.user_id = $1
		  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		ORDER BY ra.created_at DESC`

	GetOrganizationsForUserAdvancedQuery = `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at
		FROM ktrlplane.organizations o
		JOIN ktrlplane.role_assignments ra ON ra.scope_id = o.org_id AND ra.scope_type = 'organization'
		WHERE ra.user_id = $1
		  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		ORDER BY o.name`

	// Additional queries from service files
	GetOrganizationByIDQuery = `
		SELECT org_id, name, created_at, updated_at 
		FROM ktrlplane.organizations 
		WHERE org_id = $1`

	ListProjectsForUserQuery = `
		SELECT DISTINCT p.project_id, p.org_id, p.name, p.description, p.status, p.created_at, p.updated_at
		FROM ktrlplane.projects p
		LEFT JOIN ktrlplane.role_assignments ra_proj ON ra_proj.scope_id = p.project_id AND ra_proj.scope_type = 'project'
		LEFT JOIN ktrlplane.role_assignments ra_org ON ra_org.scope_id = p.org_id AND ra_org.scope_type = 'organization'
		WHERE (ra_proj.user_id = $1 OR ra_org.user_id = $1)
		ORDER BY p.name`

	CheckUserExistsQuery = `
		SELECT user_id 
		FROM ktrlplane.users 
		WHERE user_id = $1`

	GetUserByIDQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users 
		WHERE user_id = $1`

	UpdateUserEmailQuery = `
		UPDATE ktrlplane.users 
		SET email = $2 
		WHERE user_id = $1`

	UpdateUserNameQuery = `
		UPDATE ktrlplane.users 
		SET name = $2 
		WHERE user_id = $1`

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
)
