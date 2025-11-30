package db

// Project-related SQL queries
const (
	CreateProjectWithTimestampsQuery = `
		INSERT INTO ktrlplane.projects (project_id, org_id, name, description, status, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
		RETURNING created_at, updated_at`

	GetProjectByIDQuery = `
		SELECT project_id, org_id, name, description, status, created_at, updated_at FROM ktrlplane.projects WHERE project_id = $1`

	UpdateProjectQuery = `
		UPDATE ktrlplane.projects SET name = $2, description = $3, updated_at = NOW() WHERE project_id = $1`

	DeleteProjectQuery = `
		DELETE FROM ktrlplane.projects WHERE project_id = $1`

	ListProjectsForUserQuery = `
		SELECT DISTINCT p.project_id, p.org_id, p.name, p.description, p.status, p.created_at, p.updated_at
		FROM ktrlplane.projects p
		LEFT JOIN ktrlplane.role_assignments ra_proj ON ra_proj.scope_id = p.project_id AND ra_proj.scope_type = 'project'
		LEFT JOIN ktrlplane.role_assignments ra_org ON ra_org.scope_id = p.org_id AND ra_org.scope_type = 'organization'
		WHERE (ra_proj.user_id = $1 OR ra_org.user_id = $1)
		ORDER BY p.name`
)
