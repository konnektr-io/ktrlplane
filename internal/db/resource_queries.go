package db

// Resource-related SQL queries
const (
	CreateResourceQuery = `
		INSERT INTO ktrlplane.resources (resource_id, project_id, name, type, status, sku, stripe_price_id, settings_json, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Creating', $5, $6, $7, NOW(), NOW())`

	GetResourceByIDQuery = `
		SELECT resource_id, project_id, name, type, status, sku, stripe_price_id, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`

	ListResourcesQuery = `
		SELECT resource_id, project_id, name, type, status, sku, stripe_price_id, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1`

	UpdateResourceQuery = `
		UPDATE ktrlplane.resources SET name = $3, sku = $4, stripe_price_id = $5, settings_json = $6, status = 'Updating', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	DeleteResourceQuery = `
		DELETE FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`

	// ListAllUserResourcesQuery returns all resources the user has access to across all projects
	// with permission inheritance (organization -> project -> resource)
	ListAllUserResourcesQuery = `
			SELECT DISTINCT r.resource_id, r.project_id, r.name, r.type, r.status, r.sku, r.stripe_price_id, r.settings_json, r.error_message, r.created_at, r.updated_at
			FROM ktrlplane.resources r
		JOIN ktrlplane.projects p ON r.project_id = p.project_id
		WHERE EXISTS (
			-- User has direct permission on the resource
			SELECT 1 FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions perm ON rp.permission_id = perm.permission_id
			WHERE ra.user_id = $1
			  AND perm.resource_type = 'Konnektr.KtrlPlane'
			  AND perm.action = 'read'
			  AND ra.scope_type = 'resource'
			  AND ra.scope_id = r.resource_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			UNION
			-- User has permission on the project (inherited)
			SELECT 1 FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions perm ON rp.permission_id = perm.permission_id
			WHERE ra.user_id = $1
			  AND perm.resource_type = 'Konnektr.KtrlPlane'
			  AND perm.action = 'read'
			  AND ra.scope_type = 'project'
			  AND ra.scope_id = r.project_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
			UNION
			-- User has permission on the organization (inherited)
			SELECT 1 FROM ktrlplane.role_assignments ra
			JOIN ktrlplane.role_permissions rp ON ra.role_id = rp.role_id
			JOIN ktrlplane.permissions perm ON rp.permission_id = perm.permission_id
			WHERE ra.user_id = $1
			  AND perm.resource_type = 'Konnektr.KtrlPlane'
			  AND perm.action = 'read'
			  AND ra.scope_type = 'organization'
			  AND ra.scope_id = p.org_id
			  AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
		)
		AND ($2 = '' OR r.type = $2)
		ORDER BY r.created_at DESC`
)
