package db

const (
	// --- User Queries ---
	CreateUserQuery = `
		INSERT INTO users (user_id, email, name, external_auth_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())`

	// --- Organization Queries ---
	CreateOrganizationQuery = `
		INSERT INTO organizations (org_id, name, created_at)
		VALUES ($1, $2, NOW())`

	// --- Project Queries ---
	CreateProjectQuery = `
		INSERT INTO projects (project_id, name, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, 'Active', NOW(), NOW())`

	GetProjectByIDQuery = `
		SELECT * FROM projects WHERE project_id = $1`

	ListProjectsQuery = `
		SELECT * FROM projects`

	UpdateProjectQuery = `
		UPDATE projects SET name = $2, description = $3, updated_at = NOW() WHERE project_id = $1`

	DeleteProjectQuery = `
		UPDATE projects SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1`

	// --- Resource Queries ---
	CreateResourceQuery = `
		INSERT INTO resources (resource_id, project_id, name, type, status, helm_values, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Creating', $5, NOW(), NOW())`

	GetResourceByIDQuery = `
		SELECT * FROM resources WHERE project_id = $1 AND resource_id = $2`

	ListResourcesQuery = `
		SELECT * FROM resources WHERE project_id = $1`

	UpdateResourceQuery = `
		UPDATE resources SET name = $3, helm_values = $4, status = 'Updating', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	DeleteResourceQuery = `
		UPDATE resources SET status = 'Deleting', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`
)
