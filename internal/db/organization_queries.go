package db

// Organization-related SQL queries
const (
	// CreateOrganization inserts an organization and returns timestamps.
	CreateOrganization = `
		INSERT INTO ktrlplane.organizations (org_id, name, created_at, updated_at) 
		VALUES ($1, $2, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	// GetOrganizationsForUserQuery selects organizations for a user.
	GetOrganizationsForUserQuery = `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at 
		FROM ktrlplane.organizations o
		INNER JOIN ktrlplane.role_assignments ra ON ra.scope_type = 'organization' AND ra.scope_id = o.org_id
		WHERE ra.user_id = $1`

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
)
