package db

// Resource-related SQL queries
const (
	CreateResourceQuery = `
		INSERT INTO ktrlplane.resources (resource_id, project_id, name, type, status, settings_json, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'Creating', $5, NOW(), NOW())`

	GetResourceByIDQuery = `
		SELECT resource_id, project_id, name, type, status, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`

	ListResourcesQuery = `
		SELECT resource_id, project_id, name, type, status, settings_json, error_message, created_at, updated_at
		FROM ktrlplane.resources WHERE project_id = $1`

	UpdateResourceQuery = `
		UPDATE ktrlplane.resources SET name = $3, settings_json = $4, status = 'Updating', updated_at = NOW() WHERE project_id = $1 AND resource_id = $2`

	DeleteResourceQuery = `
		DELETE FROM ktrlplane.resources WHERE project_id = $1 AND resource_id = $2`
)
