package db

// User-related SQL queries
const (
	// CreateUserQuery inserts a new user into the users table.
	CreateUserQuery = `
		INSERT INTO ktrlplane.users (user_id, email, name, created_at)
		VALUES ($1, $2, $3, NOW())`

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

	// SearchUsersQuery searches for users by email, name, or user ID.
	SearchUsersQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users
		WHERE LOWER(email) LIKE LOWER($1)
			OR LOWER(name) LIKE LOWER($1)
			OR LOWER(user_id) LIKE LOWER($1)
		ORDER BY email
		LIMIT 10`

	// FindPlaceholderUserByEmailQuery finds a placeholder user (user_id = email)
	FindPlaceholderUserByEmailQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users
		WHERE user_id = $1 AND email = $1`

	// TransferRoleAssignmentsQuery transfers all role assignments from one user to another
	TransferRoleAssignmentsQuery = `
		UPDATE ktrlplane.role_assignments
		SET user_id = $2, updated_at = NOW()
		WHERE user_id = $1`

	// DeletePlaceholderUserQuery deletes a placeholder user
	DeletePlaceholderUserQuery = `
		DELETE FROM ktrlplane.users
		WHERE user_id = $1`

	// CreatePlaceholderUserQuery creates a placeholder user with email as user_id
	CreatePlaceholderUserQuery = `
		INSERT INTO ktrlplane.users (user_id, email, name, created_at)
		VALUES ($1, $1, $2, NOW())
		ON CONFLICT (user_id) DO NOTHING`
)
