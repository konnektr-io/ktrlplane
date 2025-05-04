## 1. Backend (Go)

This structure uses Gin for routing, separates concerns into handlers, services, and database access, and includes placeholders for Auth0 JWT validation and AGE interaction.

**Project Structure:**

```
ktrlplane-backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers.go
│   │   └── middleware.go
│   │   └── routes.go
│   ├── auth/
│   │   └── auth.go 
│   ├── config/
│   │   └── config.go
│   ├── db/
│   │   └── age.go
│   │   └── queries.go
│   ├── models/
│   │   └── models.go
│   └── service/
│       ├── project_service.go
│       └── resource_service.go
├── go.mod
├── go.sum
└── config.yaml # Configuration file
```

**`config.yaml`:**

```yaml
server:
  port: "8080"
database:
  host: "localhost"
  port: 5432
  user: "postgres"       # Use appropriate user
  password: "password"   # Use secrets management in production!
  dbname: "ktrlplane_db" # Your database name
  graphpath: "ktrlplane_graph" # Your AGE graph path
  sslmode: "disable"     # Use 'require' or 'verify-full' in production
auth0:
  domain: "YOUR_AUTH0_DOMAIN.auth0.com" # Replace with your Auth0 domain
  audience: "YOUR_API_AUDIENCE"       # Replace with your Auth0 API Audience
```

**`internal/config/config.go`:**

```go
package config

import (
 "fmt"
 "github.com/spf13/viper"
)

type Config struct {
 Server   ServerConfig   `mapstructure:"server"`
 Database DatabaseConfig `mapstructure:"database"`
 Auth0    Auth0Config    `mapstructure:"auth0"`
}

type ServerConfig struct {
 Port string `mapstructure:"port"`
}

type DatabaseConfig struct {
 Host      string `mapstructure:"host"`
 Port      int    `mapstructure:"port"`
 User      string `mapstructure:"user"`
 Password  string `mapstructure:"password"`
 DBName    string `mapstructure:"dbname"`
 GraphPath string `mapstructure:"graphpath"`
 SSLMode   string `mapstructure:"sslmode"`
}

type Auth0Config struct {
 Domain   string `mapstructure:"domain"`
 Audience string `mapstructure:"audience"`
}

func LoadConfig(path string) (config Config, err error) {
 viper.AddConfigPath(path)
 viper.SetConfigName("config") // Name of config file (without extension)
 viper.SetConfigType("yaml")   // REQUIRED if the config file does not have the extension in the name

 viper.AutomaticEnv() // Read in environment variables that match

 err = viper.ReadInConfig() // Find and read the config file
 if err != nil {            // Handle errors reading the config file
  return Config{}, fmt.Errorf("fatal error config file: %w", err)
 }

 err = viper.Unmarshal(&config)
 return
}
```

**`internal/db/age.go`:**

```go
package db

import (
 "context"
 "fmt"
 "github.com/apache/age/drivers/golang/age"
 "github.com/jackc/pgx/v5/pgxpool"
 "ktrlplane/internal/config" // Assuming ktrlplane is your go module name
)

var dbPool *pgxpool.Pool

// InitDB initializes the database connection pool and sets the graph path.
func InitDB(cfg config.DatabaseConfig) error {
 connString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
  cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

 poolConfig, err := pgxpool.ParseConfig(connString)
 if err != nil {
  return fmt.Errorf("unable to parse connection string: %w", err)
 }

 // TODO: Configure pool size, etc.
 // poolConfig.MaxConns = 10

 dbPool, err = pgxpool.NewWithConfig(context.Background(), poolConfig)
 if err != nil {
  return fmt.Errorf("unable to create connection pool: %w", err)
 }

 // Verify connection and set graph path
 conn, err := dbPool.Acquire(context.Background())
 if err != nil {
  return fmt.Errorf("unable to acquire connection: %w", err)
 }
 defer conn.Release()

 // Check if AGE is installed (basic check)
 _, err = conn.Exec(context.Background(), "LOAD 'age';")
 if err != nil {
  return fmt.Errorf("failed to load AGE extension (is it installed?): %w", err)
 }

 // Set the graph path for the session/connection pool
 _, err = conn.Exec(context.Background(), fmt.Sprintf("SET graph_path = %s;", age.QuoteString(cfg.GraphPath)))
 if err != nil {
  // Attempt to create graph if it doesn't exist (optional)
  if _, createErr := conn.Exec(context.Background(), age.CreateGraphCypher(cfg.GraphPath)); createErr != nil {
   return fmt.Errorf("failed to set graph_path '%s' and failed to create it: %w, create error: %v", cfg.GraphPath, err, createErr)
  }
  // Retry setting graph path after creation
  _, err = conn.Exec(context.Background(), fmt.Sprintf("SET graph_path = %s;", age.QuoteString(cfg.GraphPath)))
        if err != nil {
             return fmt.Errorf("failed to set graph_path '%s' even after attempting creation: %w", cfg.GraphPath, err)
        }
 }

 fmt.Printf("Database connection pool initialized and graph path set to '%s'\n", cfg.GraphPath)
 return nil
}

// GetDB returns the database connection pool.
func GetDB() *pgxpool.Pool {
 return dbPool
}

// CloseDB closes the database connection pool.
func CloseDB() {
 if dbPool != null {
  dbPool.Close()
  fmt.Println("Database connection pool closed.")
 }
}

// ExecCypher executes a Cypher query that doesn't return rows (CREATE, MERGE, SET, DELETE).
// It automatically wraps the query for AGE execution.
func ExecCypher(ctx context.Context, cypherQuery string, args ...interface{}) error {
    pool := GetDB()
    _, err := age.Exec(ctx, pool, cypherQuery, args...)
    if err != nil {
        return fmt.Errorf("cypher execution failed: %w, query: %s", err, cypherQuery)
    }
    return nil
}


// QueryCypher executes a Cypher query and returns an AGE Cursor for processing results.
// Remember to close the cursor using `defer cursor.Close()`.
// It automatically wraps the query for AGE execution.
func QueryCypher(ctx context.Context, cypherQuery string, args ...interface{}) (age.Cursor, error) {
 pool := GetDB()
 cursor, err := age.Query(ctx, pool, cypherQuery, args...)
 if err != nil {
  return nil, fmt.Errorf("cypher query failed: %w, query: %s", err, cypherQuery)
 }
 return cursor, nil
}
```

**`internal/db/queries.go`:** (Example Cypher Queries)

```go
package db

const (
 // --- Project Queries ---
 CreateProjectQuery = `
        CREATE (p:Project {
            project_id: $1,
            name: $2,
            description: $3,
            status: 'Active',
            created_at: agtype_build_timestamp(now()),
            updated_at: agtype_build_timestamp(now())
        })
        // Placeholder: MATCH (o:Organization {org_id: $4}) CREATE (o)-[:OWNS]->(p)
        // Placeholder: MATCH (b:BillingAccount {billing_id: $5}) CREATE (p)-[:USES_BILLING]->(b)
        RETURN p.project_id`

 GetProjectByIDQuery = `
        MATCH (p:Project {project_id: $1})
        RETURN properties(p) as project`

 ListProjectsForUserQuery = `
        // Placeholder: Needs actual RBAC relation check
        // Example: MATCH (:User {user_id: $1})-[:HAS_ROLE]->(p:Project) RETURN properties(p) as project
        MATCH (p:Project) // Temporary: List all projects
        RETURN properties(p) as project`

    UpdateProjectQuery = `
        MATCH (p:Project {project_id: $1})
        SET p.name = $2,
            p.description = $3,
            p.updated_at = agtype_build_timestamp(now())
        RETURN properties(p) as project`

 DeleteProjectQuery = ` // Soft delete by status
        MATCH (p:Project {project_id: $1})
        SET p.status = 'Deleting',
            p.updated_at = agtype_build_timestamp(now())
        // Also mark contained resources for deletion
        WITH p
        OPTIONAL MATCH (p)-[:CONTAINS_RESOURCE]->(r:Resource)
        SET r.status = 'Deleting',
            r.updated_at = agtype_build_timestamp(now())
        RETURN p.project_id`

 // --- Resource Queries ---
 CreateResourceQuery = `
        MATCH (p:Project {project_id: $1})
        CREATE (r:Resource:%s { // %s will be replaced by resource type label e.g., :GraphDatabase
            resource_id: $2,
            name: $3,
            type: $4,
            status: 'Creating', // Or 'Pending'
            helm_values: $5::agtype, // Cast JSON string to agtype
            created_at: agtype_build_timestamp(now()),
            updated_at: agtype_build_timestamp(now())
        })
        CREATE (p)-[:CONTAINS_RESOURCE]->(r)
        RETURN properties(r) as resource` // Return the created resource properties

    GetResourceByIDQuery = `
        MATCH (p:Project {project_id: $1})-[:CONTAINS_RESOURCE]->(r:Resource {resource_id: $2})
        RETURN properties(r) as resource`

    ListResourcesInProjectQuery = `
        MATCH (p:Project {project_id: $1})-[:CONTAINS_RESOURCE]->(r:Resource)
        RETURN properties(r) as resource`

    UpdateResourceQuery = `
        MATCH (p:Project {project_id: $1})-[:CONTAINS_RESOURCE]->(r:Resource {resource_id: $2})
        SET r.name = $3,
            r.helm_values = $4::agtype, // Cast JSON string to agtype
            r.status = 'Updating', // Trigger reconciliation
            r.updated_at = agtype_build_timestamp(now())
        RETURN properties(r) as resource`

    DeleteResourceQuery = ` // Soft delete by status
        MATCH (p:Project {project_id: $1})-[:CONTAINS_RESOURCE]->(r:Resource {resource_id: $2})
        SET r.status = 'Deleting',
            r.updated_at = agtype_build_timestamp(now())
        RETURN r.resource_id`

    // --- RBAC Queries (Placeholders) ---
    CheckProjectPermissionQuery = `
        // Placeholder: Needs actual RBAC check matching User -> Role -> Project
        // Example: MATCH (:User {user_id: $1})-[:HAS_ROLE {role: $3}]->(:Project {project_id: $2}) RETURN count(*) > 0
        RETURN true // Temporary: Allow all access
    `
)

```

**`internal/models/models.go`:**

```go
package models

import (
 "encoding/json"
 "time"
)

// Using map[string]interface{} for flexibility with AGE properties initially.
// Consider defining more specific structs if properties are stable.

type Project struct {
 ProjectID   string    `json:"project_id" agtype:"project_id"`
 Name        string    `json:"name" agtype:"name"`
 Description string    `json:"description,omitempty" agtype:"description"`
 Status      string    `json:"status" agtype:"status"`
 CreatedAt   time.Time `json:"created_at" agtype:"created_at"`
 UpdatedAt   time.Time `json:"updated_at" agtype:"updated_at"`
 // Add OrgID, BillingID if linking relationships
}

type Resource struct {
 ResourceID  string          `json:"resource_id" agtype:"resource_id"`
 ProjectID   string          `json:"project_id"` // Added for context, not directly in node usually
 Name        string          `json:"name" agtype:"name"`
 Type        string          `json:"type" agtype:"type"` // e.g., "GraphDatabase", "Flow"
 Status      string          `json:"status" agtype:"status"`
 HelmValues  json.RawMessage `json:"helm_values" agtype:"helm_values"` // Store as raw JSON
 CreatedAt   time.Time       `json:"created_at" agtype:"created_at"`
 UpdatedAt   time.Time       `json:"updated_at" agtype:"updated_at"`
 ErrorMessage string         `json:"error_message,omitempty" agtype:"error_message"`
    // Specific fields for resource types might be present but accessed via HelmValues
    AccessURL   string          `json:"access_url,omitempty" agtype:"access_url"` // Example specific field
}

// --- API Request/Response Payloads ---

type CreateProjectRequest struct {
 Name        string `json:"name" binding:"required"`
 Description string `json:"description"`
 // OrgID       string `json:"org_id" binding:"required"`
 // BillingID   string `json:"billing_id" binding:"required"`
}

type UpdateProjectRequest struct {
 Name        *string `json:"name"` // Use pointers to distinguish between empty and not provided
 Description *string `json:"description"`
}


type CreateResourceRequest struct {
 Name       string          `json:"name" binding:"required"`
 Type       string          `json:"type" binding:"required"` // e.g., "GraphDatabase"
 HelmValues json.RawMessage `json:"helm_values"`             // Initial Helm values as JSON
}

type UpdateResourceRequest struct {
 Name       *string         `json:"name"`
 HelmValues json.RawMessage `json:"helm_values"` // Send full JSON structure to update
}

// User model (simplified for identifying user from token)
type User struct {
 ID    string   // Subject from JWT
 Email string   // Email from JWT
 Roles []string // Roles derived from JWT or DB lookup (placeholder)
}
```

**`internal/service/project_service.go`:**

```go
package service

import (
 "context"
 "encoding/json"
 "fmt"
 "ktrlplane/internal/db"
 "ktrlplane/internal/models"
 "github.com/google/uuid" // For generating IDs
    "github.com/apache/age/drivers/golang/age"
)

type ProjectService struct{}

func NewProjectService() *ProjectService {
 return &ProjectService{}
}

func (s *ProjectService) CreateProject(ctx context.Context, req models.CreateProjectRequest) (*models.Project, error) {
 projectID := uuid.New().String() // Generate unique ID

 // Execute Cypher query using the db package function
 err := db.ExecCypher(ctx, db.CreateProjectQuery,
  projectID,
  req.Name,
  req.Description,
  // Pass OrgID, BillingID if needed
 )
 if err != nil {
  return nil, fmt.Errorf("failed to create project node: %w", err)
 }

    // Fetch the created project to return its full details
    // Alternatively, modify CreateProjectQuery to return properties(p)
    createdProject, err := s.GetProjectByID(ctx, projectID)
    if err != nil {
        // Log error, but might proceed if creation itself didn't error
        fmt.Printf("Warning: failed to fetch newly created project %s details: %v\n", projectID, err)
        // Return a minimal representation if fetch fails
        return &models.Project{
            ProjectID:   projectID,
            Name:        req.Name,
            Description: req.Description,
            Status:      "Active", // Assume default status
        }, nil
    }

 return createdProject, nil
}

func (s *ProjectService) GetProjectByID(ctx context.Context, projectID string) (*models.Project, error) {
 cursor, err := db.QueryCypher(ctx, db.GetProjectByIDQuery, projectID)
 if err != nil {
  return nil, fmt.Errorf("failed to query project by ID: %w", err)
 }
 defer cursor.Close()

 var project *models.Project
 if cursor.Next() {
        entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get project row: %w", err)
        }

        if projVal, ok := entity["project"].(age.Vertex); ok {
             propsMap := projVal.GetMap()
             // Manual mapping - consider reflection or mapstructure if complex
             p := &models.Project{
                 ProjectID: propsMap["project_id"].(string),
                 Name:      propsMap["name"].(string),
                 Status:    propsMap["status"].(string),
             }
             if desc, ok := propsMap["description"].(string); ok {
                 p.Description = desc
             }
             if ts, err := age.ParseTimestamp(propsMap["created_at"].(age.Timestamp)); err == nil {
                 p.CreatedAt = ts
             }
              if ts, err := age.ParseTimestamp(propsMap["updated_at"].(age.Timestamp)); err == nil {
                 p.UpdatedAt = ts
             }
             project = p
        } else {
             return nil, fmt.Errorf("unexpected data type returned for project: %T", entity["project"])
        }
 }

 if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error fetching project: %w", err)
 }

 if project == nil {
  return nil, fmt.Errorf("project not found: %s", projectID) // Or return nil, nil?
 }

 return project, nil
}


func (s *ProjectService) ListProjects(ctx context.Context, userID string) ([]models.Project, error) {
    // Placeholder: Pass userID to the query when RBAC is implemented
 cursor, err := db.QueryCypher(ctx, db.ListProjectsForUserQuery /*, userID */)
 if err != nil {
  return nil, fmt.Errorf("failed to query projects: %w", err)
 }
 defer cursor.Close()

 var projects []models.Project
 for cursor.Next() {
  entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get project row: %w", err)
        }

        if projVal, ok := entity["project"].(age.Vertex); ok {
             propsMap := projVal.GetMap()
             // Manual mapping - consider reflection or mapstructure
             p := models.Project{
                 ProjectID: propsMap["project_id"].(string),
                 Name:      propsMap["name"].(string),
                 Status:    propsMap["status"].(string),
             }
              if desc, ok := propsMap["description"].(string); ok {
                 p.Description = desc
             }
             if ts, err := age.ParseTimestamp(propsMap["created_at"].(age.Timestamp)); err == nil {
                 p.CreatedAt = ts
             }
              if ts, err := age.ParseTimestamp(propsMap["updated_at"].(age.Timestamp)); err == nil {
                 p.UpdatedAt = ts
             }
             projects = append(projects, p)
        } else {
             fmt.Printf("Warning: skipping row, unexpected data type returned for project: %T\n", entity["project"])
        }
 }

 if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error fetching projects: %w", err)
 }

 return projects, nil
}

func (s *ProjectService) UpdateProject(ctx context.Context, projectID string, req models.UpdateProjectRequest) (*models.Project, error) {
    // Fetch current project to get existing values if fields are nil in request
    currentProject, err := s.GetProjectByID(ctx, projectID)
    if err != nil {
        return nil, fmt.Errorf("cannot update non-existent project %s: %w", projectID, err)
    }

    name := currentProject.Name
    if req.Name != nil {
        name = *req.Name
    }
    description := currentProject.Description
     if req.Description != nil {
        description = *req.Description
    }

    cursor, err := db.QueryCypher(ctx, db.UpdateProjectQuery, projectID, name, description)
    if err != nil {
        return nil, fmt.Errorf("failed to update project: %w", err)
    }
    defer cursor.Close()

    // Process the returned updated project data (similar to GetProjectByID)
    if cursor.Next() {
         entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get updated project row: %w", err)
        }
        // ... (mapping logic similar to GetProjectByID) ...
        // For simplicity, just refetch after update
        return s.GetProjectByID(ctx, projectID)
    }
     if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error updating project: %w", err)
 }

    // Should ideally return the updated project from the query result
    return s.GetProjectByID(ctx, projectID)
}

func (s *ProjectService) DeleteProject(ctx context.Context, projectID string) error {
 err := db.ExecCypher(ctx, db.DeleteProjectQuery, projectID)
 if err != nil {
  return fmt.Errorf("failed to mark project %s for deletion: %w", projectID, err)
 }
 // Note: Actual deletion from DB might need a background job
    // Also, the DatabaseQuery Operator with prune=true should handle K8s cleanup
 return nil
}

// Placeholder for RBAC related service methods
// func (s *ProjectService) ListProjectMembers(ctx context.Context, projectID string) ([]models.Member, error)
// func (s *ProjectService) AddProjectMember(ctx context.Context, projectID string, userID string, role string) error
// func (s *ProjectService) RemoveProjectMember(ctx context.Context, projectID string, userID string) error

```

**`internal/service/resource_service.go`:** (Similar structure to ProjectService)

```go
package service

import (
 "context"
 "encoding/json"
 "fmt"
 "ktrlplane/internal/db"
 "ktrlplane/internal/models"
    "strings"

 "github.com/apache/age/drivers/golang/age"
 "github.com/google/uuid"
)

type ResourceService struct{}

func NewResourceService() *ResourceService {
 return &ResourceService{}
}

func (s *ResourceService) CreateResource(ctx context.Context, projectID string, req models.CreateResourceRequest) (*models.Resource, error) {
 resourceID := uuid.New().String()

    // Basic validation for type label (prevent injection)
    // TODO: Use a predefined list of allowed types
    resourceTypeLabel := ":" + req.Type // e.g., :GraphDatabase
    if !isValidLabel(req.Type) {
         return nil, fmt.Errorf("invalid resource type specified: %s", req.Type)
    }

    // Ensure HelmValues is valid JSON or default to "{}"
 helmValuesJSON := "{}"
 if len(req.HelmValues) > 0 {
        // Validate JSON
        var js json.RawMessage
        if err := json.Unmarshal(req.HelmValues, &js); err != nil {
             return nil, fmt.Errorf("invalid helm_values JSON: %w", err)
        }
  helmValuesJSON = string(req.HelmValues)
 }


    // Format the query string securely to include the type label
    formattedQuery := fmt.Sprintf(db.CreateResourceQuery, resourceTypeLabel)

    cursor, err := db.QueryCypher(ctx, formattedQuery,
  projectID,
  resourceID,
  req.Name,
        req.Type, // Store type as property as well
  helmValuesJSON,
 )
 if err != nil {
  return nil, fmt.Errorf("failed to create resource node: %w", err)
 }
    defer cursor.Close()


    if cursor.Next() {
        entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get created resource row: %w", err)
        }

        if resVal, ok := entity["resource"].(age.Vertex); ok {
            resource := mapVertexToResource(resVal)
            resource.ProjectID = projectID // Add project context
            return &resource, nil
        } else {
             return nil, fmt.Errorf("unexpected data type returned for resource: %T", entity["resource"])
        }
    }

     if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error creating resource: %w", err)
 }

    return nil, fmt.Errorf("resource creation did not return the new resource") // Should not happen if query is correct
}

func (s *ResourceService) GetResourceByID(ctx context.Context, projectID string, resourceID string) (*models.Resource, error) {
 cursor, err := db.QueryCypher(ctx, db.GetResourceByIDQuery, projectID, resourceID)
 if err != nil {
  return nil, fmt.Errorf("failed to query resource by ID: %w", err)
 }
 defer cursor.Close()

    var resource *models.Resource
 if cursor.Next() {
        entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get resource row: %w", err)
        }

         if resVal, ok := entity["resource"].(age.Vertex); ok {
            r := mapVertexToResource(resVal)
            r.ProjectID = projectID // Add context
            resource = &r
        } else {
             return nil, fmt.Errorf("unexpected data type returned for resource: %T", entity["resource"])
        }
 }
     if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error fetching resource: %w", err)
 }

    if resource == nil {
  return nil, fmt.Errorf("resource not found: %s in project %s", resourceID, projectID)
 }

 return resource, nil
}

func (s *ResourceService) ListResources(ctx context.Context, projectID string) ([]models.Resource, error) {
 cursor, err := db.QueryCypher(ctx, db.ListResourcesInProjectQuery, projectID)
 if err != nil {
  return nil, fmt.Errorf("failed to query resources: %w", err)
 }
 defer cursor.Close()

 var resources []models.Resource
 for cursor.Next() {
  entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get resource row: %w", err)
        }

        if resVal, ok := entity["resource"].(age.Vertex); ok {
            r := mapVertexToResource(resVal)
            r.ProjectID = projectID // Add context
            resources = append(resources, r)
        } else {
             fmt.Printf("Warning: skipping row, unexpected data type returned for resource: %T\n", entity["resource"])
        }
 }

 if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error fetching resources: %w", err)
 }

 return resources, nil
}

func (s *ResourceService) UpdateResource(ctx context.Context, projectID string, resourceID string, req models.UpdateResourceRequest) (*models.Resource, error) {
    // Fetch current resource
    currentResource, err := s.GetResourceByID(ctx, projectID, resourceID)
    if err != nil {
        return nil, fmt.Errorf("cannot update non-existent resource %s in project %s: %w", resourceID, projectID, err)
    }

    name := currentResource.Name
    if req.Name != nil {
        name = *req.Name
    }

    helmValuesJSON := string(currentResource.HelmValues)
    if len(req.HelmValues) > 0 {
         // Validate JSON
        var js json.RawMessage
        if err := json.Unmarshal(req.HelmValues, &js); err != nil {
             return nil, fmt.Errorf("invalid helm_values JSON: %w", err)
        }
        helmValuesJSON = string(req.HelmValues)
    }


    cursor, err := db.QueryCypher(ctx, db.UpdateResourceQuery,
        projectID,
        resourceID,
        name,
        helmValuesJSON,
    )
    if err != nil {
        return nil, fmt.Errorf("failed to update resource: %w", err)
    }
    defer cursor.Close()

     // Process the returned updated resource data
    if cursor.Next() {
         entity, err := cursor.GetRow()
        if err != nil {
            return nil, fmt.Errorf("failed to get updated resource row: %w", err)
        }
         if resVal, ok := entity["resource"].(age.Vertex); ok {
             resource := mapVertexToResource(resVal)
             resource.ProjectID = projectID // Add project context
             return &resource, nil
         } else {
             return nil, fmt.Errorf("unexpected data type returned for updated resource: %T", entity["resource"])
         }
    }
     if err := cursor.Err(); err != nil {
  return nil, fmt.Errorf("cursor error updating resource: %w", err)
 }

    // Fallback: refetch if query didn't return directly (should be fixed in query)
    return s.GetResourceByID(ctx, projectID, resourceID)
}


func (s *ResourceService) DeleteResource(ctx context.Context, projectID string, resourceID string) error {
 err := db.ExecCypher(ctx, db.DeleteResourceQuery, projectID, resourceID)
 if err != nil {
  return fmt.Errorf("failed to mark resource %s for deletion: %w", resourceID, err)
 }
 return nil
}

// --- Helper Functions ---

// Basic validation for graph labels (prevents injection in formatted queries)
func isValidLabel(label string) bool {
    // Only allow alphanumeric characters (and maybe underscore)
    // Adjust regex as needed for your label conventions
    for _, r := range label {
        if (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') && (r < '0' || r > '9') {
            return false
        }
    }
    return label != "" && !strings.Contains(label, ":") && !strings.Contains(label, " ")
}


// mapVertexToResource converts an age.Vertex (assumed to be a Resource) to models.Resource
func mapVertexToResource(v age.Vertex) models.Resource {
    propsMap := v.GetMap()
    r := models.Resource{
        ResourceID: propsMap["resource_id"].(string),
        Name:       propsMap["name"].(string),
        Type:       propsMap["type"].(string),
        Status:     propsMap["status"].(string),
    }
     if hv, ok := propsMap["helm_values"]; ok {
        // AGE stores agtype jsonb, driver might return string or map - handle appropriately
        switch val := hv.(type) {
        case string:
             r.HelmValues = json.RawMessage(val)
        case map[string]interface{}:
             // marshal it back to json RawMessage
             rawJson, err := json.Marshal(val)
             if err == nil {
                  r.HelmValues = rawJson
             } else {
                  fmt.Printf("Warning: could not marshal helm_values map to json: %v\n", err)
                  r.HelmValues = json.RawMessage("{}")
             }
        default:
             fmt.Printf("Warning: unexpected type for helm_values: %T\n", hv)
             r.HelmValues = json.RawMessage("{}")
        }
    } else {
         r.HelmValues = json.RawMessage("{}") // Default empty JSON
    }

    if ts, err := age.ParseTimestamp(propsMap["created_at"].(age.Timestamp)); err == nil {
        r.CreatedAt = ts
    }
    if ts, err := age.ParseTimestamp(propsMap["updated_at"].(age.Timestamp)); err == nil {
        r.UpdatedAt = ts
    }
     if errMsg, ok := propsMap["error_message"].(string); ok {
         r.ErrorMessage = errMsg
     }
      if accessURL, ok := propsMap["access_url"].(string); ok {
         r.AccessURL = accessURL
     }

    return r
}
```

**`internal/auth/auth.go`:** (Placeholder)

```go
package auth

import (
 "context"
 "fmt"
 "ktrlplane/internal/models"
 "net/http"
 "strings"

 "github.com/gin-gonic/gin"
 // Example using auth0 jwtmiddleware
 // jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
 // "github.com/auth0/go-jwt-middleware/v2/validator"
 // Replace with your actual JWT validation library and logic
)

// Placeholder for Auth0 configuration needed by middleware
var (
 // jwtValidator *validator.Validator
 apiAudience string
 auth0Domain string
)

func SetupAuth(audience, domain string) error {
 apiAudience = audience
 auth0Domain = domain
 // Initialize your actual JWT validator here based on domain/audience
 // Example:
 // keyFunc := func(ctx context.Context) (interface{}, error) { ... } // Fetch JWKS
 // jwtValidator, err := validator.New(keyFunc, validator.RS256, ...)
 // if err != nil { return fmt.Errorf("failed to set up jwt validator: %w", err) }
 fmt.Println("Auth placeholder setup complete. Implement actual JWT validation.")
 return nil
}

// AuthMiddleware validates the JWT token. Placeholder implementation.
func AuthMiddleware() gin.HandlerFunc {
 return func(c *gin.Context) {
  token := extractToken(c.Request)
  if token == "" {
   c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
   return
  }

  // ---=== Placeholder: Replace with actual JWT Validation ===---
  // claims, err := jwtValidator.ValidateToken(context.Background(), token)
  // if err != nil {
  //   c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "details": err.Error()})
  //   return
  // }
  // validatedClaims := claims.(*validator.ValidatedClaims)
  // customClaims := validatedClaims.CustomClaims.(*YourCustomClaimsStruct) // If you have custom claims

  // ---=== Mock Validation and User Extraction ===---
  if !strings.HasPrefix(token, "valid-token-for-") { // Simple mock check
    c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token (mock)"})
    return
  }
  mockUserID := strings.TrimPrefix(token, "valid-token-for-")
  // ---============================================---


  // Set user information in the context for downstream handlers
  user := models.User{
   ID: mockUserID, // Replace with subject from validatedClaims.RegisteredClaims.Subject
   // Email: customClaims.Email, // Extract email if available
   Roles: []string{}, // Placeholder: Roles need to be determined (e.g., from token or DB lookup)
  }
  c.Set("user", user)

  fmt.Printf("Mock authentication successful for user: %s\n", user.ID)
  c.Next()
 }
}

// RBACMiddleware checks if the user in context has the required role for the project. Placeholder.
func RBACMiddleware(requiredRole string) gin.HandlerFunc {
 return func(c *gin.Context) {
  user, exists := c.Get("user")
  if !exists {
   c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "User context not found"})
   return
  }
  currentUser := user.(models.User) // Type assertion

  projectID := c.Param("projectId") // Assuming project ID is in the URL path
  if projectID == "" {
   c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Project ID missing in request path"})
   return
  }

  // ---=== Placeholder: Replace with actual RBAC check ===---
  // hasPermission, err := checkPermissionInDB(c.Request.Context(), currentUser.ID, projectID, requiredRole)
  // if err != nil {
  //      c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
  //      return
  // }
  // if !hasPermission {
  //      c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
  //      return
  // }
  hasPermission := true // Mock permission
  // ---===================================================---

  if !hasPermission {
    c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions (mock)"})
    return
  }


  fmt.Printf("Mock RBAC check successful for user %s, project %s, role %s\n", currentUser.ID, projectID, requiredRole)
  c.Next()
 }
}


// Helper to extract token from Authorization header
func extractToken(r *http.Request) string {
 bearerToken := r.Header.Get("Authorization")
 if parts := strings.Split(bearerToken, " "); len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
  return parts[1]
 }
 return ""
}

// --- Placeholder for actual DB check ---
// func checkPermissionInDB(ctx context.Context, userID, projectID, requiredRole string) (bool, error) {
//     // Use db.QueryCypher with db.CheckProjectPermissionQuery
//     // Process the result (e.g., count > 0)
//     fmt.Printf("Placeholder: Checking DB permission for user %s, project %s, role %s\n", userID, projectID, requiredRole)
//     return true, nil // Mock response
// }
```

**`internal/api/handlers.go`:**

```go
package api

import (
 "ktrlplane/internal/models"
 "ktrlplane/internal/service"
 "net/http"

 "github.com/gin-gonic/gin"
)

type APIHandler struct {
 ProjectService  *service.ProjectService
 ResourceService *service.ResourceService
}

func NewAPIHandler(ps *service.ProjectService, rs *service.ResourceService) *APIHandler {
 return &APIHandler{
  ProjectService:  ps,
  ResourceService: rs,
 }
}

// --- User Util ---
func getUserFromContext(c *gin.Context) (models.User, bool) {
 user, exists := c.Get("user")
 if !exists {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"})
  return models.User{}, false
 }
 currentUser, ok := user.(models.User)
 if !ok {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context type"})
  return models.User{}, false
 }
 return currentUser, true
}


// --- Project Handlers ---

func (h *APIHandler) CreateProject(c *gin.Context) {
 var req models.CreateProjectRequest
 if err := c.ShouldBindJSON(&req); err != nil {
  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  return
 }

 // user, ok := getUserFromContext(c) // Use user ID if needed for association
 // if !ok { return }

 project, err := h.ProjectService.CreateProject(c.Request.Context(), req)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project", "details": err.Error()})
  return
 }
 c.JSON(http.StatusCreated, project)
}

func (h *APIHandler) GetProject(c *gin.Context) {
 projectID := c.Param("projectId")
 project, err := h.ProjectService.GetProjectByID(c.Request.Context(), projectID)
 if err != nil {
  // Differentiate between not found and other errors
  c.JSON(http.StatusNotFound, gin.H{"error": "Project not found", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, project)
}


func (h *APIHandler) ListProjects(c *gin.Context) {
    user, ok := getUserFromContext(c)
 if !ok { return }

 projects, err := h.ProjectService.ListProjects(c.Request.Context(), user.ID)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list projects", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, projects)
}

func (h *APIHandler) UpdateProject(c *gin.Context) {
 projectID := c.Param("projectId")
    var req models.UpdateProjectRequest
 if err := c.ShouldBindJSON(&req); err != nil {
  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  return
 }

 project, err := h.ProjectService.UpdateProject(c.Request.Context(), projectID, req)
    if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, project)
}

func (h *APIHandler) DeleteProject(c *gin.Context) {
 projectID := c.Param("projectId")
 err := h.ProjectService.DeleteProject(c.Request.Context(), projectID)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project", "details": err.Error()})
  return
 }
 c.JSON(http.StatusAccepted, gin.H{"message": "Project deletion initiated"}) // 202 Accepted
}

// --- Resource Handlers ---

func (h *APIHandler) CreateResource(c *gin.Context) {
 projectID := c.Param("projectId")
 var req models.CreateResourceRequest
 if err := c.ShouldBindJSON(&req); err != nil {
  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  return
 }

 resource, err := h.ResourceService.CreateResource(c.Request.Context(), projectID, req)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource", "details": err.Error()})
  return
 }
 c.JSON(http.StatusCreated, resource)
}


func (h *APIHandler) GetResource(c *gin.Context) {
 projectID := c.Param("projectId")
 resourceID := c.Param("resourceId")

 resource, err := h.ResourceService.GetResourceByID(c.Request.Context(), projectID, resourceID)
 if err != nil {
  c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, resource)
}

func (h *APIHandler) ListResources(c *gin.Context) {
 projectID := c.Param("projectId")

 resources, err := h.ResourceService.ListResources(c.Request.Context(), projectID)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list resources", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, resources)
}


func (h *APIHandler) UpdateResource(c *gin.Context) {
 projectID := c.Param("projectId")
 resourceID := c.Param("resourceId")
    var req models.UpdateResourceRequest
 if err := c.ShouldBindJSON(&req); err != nil {
  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  return
 }

 resource, err := h.ResourceService.UpdateResource(c.Request.Context(), projectID, resourceID, req)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource", "details": err.Error()})
  return
 }
 c.JSON(http.StatusOK, resource)
}

func (h *APIHandler) DeleteResource(c *gin.Context) {
 projectID := c.Param("projectId")
 resourceID := c.Param("resourceId")

 err := h.ResourceService.DeleteResource(c.Request.Context(), projectID, resourceID)
 if err != nil {
  c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource", "details": err.Error()})
  return
 }
 c.JSON(http.StatusAccepted, gin.H{"message": "Resource deletion initiated"})
}

// --- Placeholder Handlers ---

func (h *APIHandler) GetResourceLogs(c *gin.Context) {
 // Placeholder: Needs integration with Kubernetes API client
    // projectID := c.Param("projectId")
 // resourceID := c.Param("resourceId")
 c.JSON(http.StatusNotImplemented, gin.H{"message": "Fetching resource logs not implemented yet"})
}

func (h *APIHandler) GetResourceStatus(c *gin.Context) {
 // Placeholder: Could fetch from AGE or poll Kubernetes API
    // projectID := c.Param("projectId")
 // resourceID := c.Param("resourceId")
    // For now, just return the stored resource data which includes status
    h.GetResource(c)
 // c.JSON(http.StatusNotImplemented, gin.H{"message": "Fetching real-time resource status not implemented yet"})
}

func (h *APIHandler) ListProjectMembers(c *gin.Context) {
    // Placeholder: Implement RBAC service call
 // projectID := c.Param("projectId")
 c.JSON(http.StatusNotImplemented, gin.H{"message": "Listing project members not implemented yet"})
}

func (h *APIHandler) AddProjectMember(c *gin.Context) {
     // Placeholder: Implement RBAC service call
 // projectID := c.Param("projectId")
 // Bind request body (userID, role)
 c.JSON(http.StatusNotImplemented, gin.H{"message": "Adding project member not implemented yet"})
}

func (h *APIHandler) RemoveProjectMember(c *gin.Context) {
     // Placeholder: Implement RBAC service call
 // projectID := c.Param("projectId")
 // userID := c.Param("userId")
 c.JSON(http.StatusNotImplemented, gin.H{"message": "Removing project member not implemented yet"})
}
```

**`internal/api/middleware.go`:**

```go
package api

import (
 "github.com/gin-contrib/cors"
 "github.com/gin-gonic/gin"
 "time"
)

func CORSMiddleware() gin.HandlerFunc {
 return cors.New(cors.Config{
  // AllowOrigins:     []string{"http://localhost:5173", "https://your-frontend-domain.com"}, // Frontend URL
  AllowAllOrigins:  true, // For development, restrict in production
  AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
  AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
  ExposeHeaders:    []string{"Content-Length"},
  AllowCredentials: true,
  MaxAge:           12 * time.Hour,
 })
}
```

**`internal/api/routes.go`:**

```go
package api

import (
 "ktrlplane/internal/auth" // Import auth package
 "github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router with all routes and middleware.
func SetupRouter(handler *APIHandler) *gin.Engine {
 r := gin.Default()

 // Apply CORS middleware globally
 r.Use(CORSMiddleware())

    // --- Public Routes (Example: Health Check) ---
    r.GET("/health", func(c *gin.Context) {
        // Placeholder: Check DB connection?
        c.JSON(200, gin.H{"status": "UP"})
    })


 // API v1 routes
 apiV1 := r.Group("/api/v1")

    // Apply Auth middleware to all /api/v1 routes
    apiV1.Use(auth.AuthMiddleware()) // Enable Auth middleware
    {
        // --- Project Routes ---
        projects := apiV1.Group("/projects")
        {
            projects.POST("", handler.CreateProject) // Create Project
            projects.GET("", handler.ListProjects)   // List Projects user has access to

            projectDetail := projects.Group("/:projectId")
            // Apply RBAC middleware - adjust roles as needed (e.g., "viewer", "editor", "owner")
            projectDetail.Use(auth.RBACMiddleware("viewer")) // Basic view access needed for all sub-routes
            {
                projectDetail.GET("", handler.GetProject) // Get specific project details
                 // Use stricter role for modification/deletion
                projectDetail.PUT("", auth.RBACMiddleware("editor"), handler.UpdateProject) // Update Project
                projectDetail.DELETE("", auth.RBACMiddleware("owner"), handler.DeleteProject) // Delete Project (Requires owner role)

                 // --- Resource Routes (nested under project) ---
                resources := projectDetail.Group("/resources")
                {
                    resources.POST("", auth.RBACMiddleware("editor"), handler.CreateResource) // Create Resource (Editor role)
                    resources.GET("", handler.ListResources) // List resources in the project (Viewer role)

                    resourceDetail := resources.Group("/:resourceId")
                    {
                        resourceDetail.GET("", handler.GetResource)          // Get specific resource details (Viewer role)
                        resourceDetail.PUT("", auth.RBACMiddleware("editor"), handler.UpdateResource) // Update Resource (Editor role)
                        resourceDetail.DELETE("", auth.RBACMiddleware("editor"), handler.DeleteResource) // Delete Resource (Editor role) // Or owner?
                        resourceDetail.GET("/logs", handler.GetResourceLogs)     // Get Resource Logs (Viewer role) - Placeholder
                        resourceDetail.GET("/status", handler.GetResourceStatus) // Get Resource Status (Viewer role) - Placeholder
                    }
                }
                 // --- RBAC Routes (nested under project) ---
                 rbac := projectDetail.Group("/rbac")
                 rbac.Use(auth.RBACMiddleware("owner")) // Managing RBAC typically requires owner role
                 {
                    rbac.GET("", handler.ListProjectMembers) // List members and roles
                    rbac.POST("", handler.AddProjectMember) // Add/invite member with role
                    // Maybe DELETE /rbac/{userId} ?
                    rbac.DELETE("/:userId", handler.RemoveProjectMember) // Remove member
                 }
            }
        }

        // --- Other potential top-level routes (e.g., Billing, Orgs) ---
        // apiV1.GET("/billingAccounts", ...)
        // apiV1.GET("/orgs", ...)
    }


 return r
}
```

**`cmd/server/main.go`:**

```go
package main

import (
 "context"
 "fmt"
 "ktrlplane/internal/api"
 "ktrlplane/internal/auth" // Import auth package
 "ktrlplane/internal/config"
 "ktrlplane/internal/db"
 "ktrlplane/internal/service"
 "log"
 "net/http"
 "os"
 "os/signal"
 "syscall"
 "time"
)

func main() {
 // --- Configuration ---
 cfg, err := config.LoadConfig(".") // Load config from current directory
 if err != nil {
  log.Fatalf("Failed to load configuration: %v", err)
 }

 // --- Database Initialization ---
 if err := db.InitDB(cfg.Database); err != nil {
  log.Fatalf("Failed to initialize database: %v", err)
 }
 defer db.CloseDB()

 // --- Authentication Setup ---
    // Pass Auth0 config to the auth package
 if err := auth.SetupAuth(cfg.Auth0.Audience, cfg.Auth0.Domain); err != nil {
        log.Fatalf("Failed to set up authentication: %v", err)
    }

 // --- Service Initialization ---
 projectService := service.NewProjectService()
 resourceService := service.NewResourceService()

 // --- API Handler Initialization ---
 apiHandler := api.NewAPIHandler(projectService, resourceService)

 // --- Router Setup ---
 router := api.SetupRouter(apiHandler)

 // --- Server Initialization ---
 serverAddr := ":" + cfg.Server.Port
 srv := &http.Server{
  Addr:    serverAddr,
  Handler: router,
  // Add other server configurations like timeouts
  ReadTimeout:  10 * time.Second,
  WriteTimeout: 10 * time.Second,
  IdleTimeout:  120 * time.Second,
 }

 // --- Graceful Shutdown Setup ---
 go func() {
  log.Printf("Starting server on %s", serverAddr)
  if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
   log.Fatalf("ListenAndServe(): %v", err)
  }
 }()

 // Wait for interrupt signal to gracefully shutdown the server
 quit := make(chan os.Signal, 1)
 // kill (no param) default send syscall.SIGTERM
 // kill -2 is syscall.SIGINT
 // kill -9 is syscall.SIGKILL but can't be caught
 signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
 <-quit
 log.Println("Shutting down server...")

 // The context is used to inform the server it has 5 seconds to finish
 // the requests it is currently handling
 ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
 defer cancel()

 if err := srv.Shutdown(ctx); err != nil {
  log.Fatal("Server forced to shutdown:", err)
 }

 log.Println("Server exiting")
}
```

**To Run Backend:**

1. Install Go.
2. Install PostgreSQL and Apache AGE extension.
3. Create the database and graph path specified in `config.yaml`.
4. Replace placeholder values in `config.yaml` (especially Auth0).
5. `go mod tidy`
6. `go run cmd/server/main.go`

---
