package db

// User-related SQL queries
const (
	// CreateUserQuery inserts a new user into the users table.
	CreateUserQuery = `
		INSERT INTO ktrlplane.users (user_id, email, name, external_auth_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())`

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

	// SearchUsersQuery searches for users by email, name, or user ID.
	SearchUsersQuery = `
		SELECT user_id, email, name
		FROM ktrlplane.users
		WHERE LOWER(email) LIKE LOWER($1)
			OR LOWER(name) LIKE LOWER($1)
			OR LOWER(user_id) LIKE LOWER($1)
		ORDER BY email
		LIMIT 10`
)
