-- Migration: Resource Types System and Enhanced Resource Management
-- Adds support for dynamic resource types, deployment tracking, and schema validation

-- Resource Types Registry
CREATE TABLE ktrlplane.resource_types (
    type_name VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'application',
    settings_schema JSONB NOT NULL,
    deployment_spec JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Resource Deployments Tracking
CREATE TABLE ktrlplane.resource_deployments (
    deployment_id VARCHAR(255) PRIMARY KEY,
    resource_id VARCHAR(255) REFERENCES ktrlplane.resources(resource_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', 
    -- Status: pending, deploying, ready, failed, updating, deleting
    helm_release_name VARCHAR(255),
    helm_namespace VARCHAR(255),
    deployment_logs JSONB DEFAULT '[]'::jsonb,
    health_status JSONB DEFAULT '{}'::jsonb,
    deployment_started_at TIMESTAMP,
    deployment_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_resource_deployments_resource_id ON ktrlplane.resource_deployments(resource_id);
CREATE INDEX idx_resource_deployments_status ON ktrlplane.resource_deployments(status);
CREATE INDEX idx_resource_types_category ON ktrlplane.resource_types(category);
CREATE INDEX idx_resource_types_active ON ktrlplane.resource_types(is_active);

-- Insert built-in resource types
INSERT INTO ktrlplane.resource_types (
    type_name, 
    display_name, 
    description, 
    category,
    settings_schema, 
    deployment_spec, 
    is_system
) VALUES 
(
    'Konnektr.DigitalTwins',
    'Age Digital Twins',
    'Graph database with digital twins capabilities using Apache AGE',
    'database',
    '{
        "type": "object",
        "properties": {
            "instances": {
                "type": "number",
                "minimum": 1,
                "maximum": 6,
                "default": 1,
                "title": "Number of Instances",
                "description": "Number of database instances to deploy"
            },
            "eventSinks": {
                "type": "object",
                "title": "Event Sinks",
                "properties": {
                    "kafka": {
                        "type": "array",
                        "title": "Kafka Sinks",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string", "title": "Sink Name"},
                                "brokerList": {"type": "string", "title": "Broker List"},
                                "topic": {"type": "string", "title": "Topic"},
                                "saslMechanism": {"type": "string", "enum": ["PLAIN", "SCRAM-SHA-256"], "default": "PLAIN"},
                                "saslUsername": {"type": "string", "title": "SASL Username"},
                                "saslPasswordSecretRef": {"type": "string", "title": "Password Secret Reference"},
                                "saslPasswordSecretKey": {"type": "string", "title": "Password Secret Key"}
                            },
                            "required": ["name", "brokerList", "topic"]
                        }
                    },
                    "kusto": {
                        "type": "array",
                        "title": "Kusto Sinks",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string", "title": "Sink Name"},
                                "ingestionUri": {"type": "string", "title": "Ingestion URI"},
                                "database": {"type": "string", "title": "Database Name"}
                            },
                            "required": ["name", "ingestionUri", "database"]
                        }
                    },
                    "mqtt": {
                        "type": "array",
                        "title": "MQTT Sinks",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string", "title": "Sink Name"},
                                "brokerUrl": {"type": "string", "title": "Broker URL"},
                                "topic": {"type": "string", "title": "Topic"},
                                "clientId": {"type": "string", "title": "Client ID"}
                            },
                            "required": ["name", "brokerUrl", "topic"]
                        }
                    }
                },
                "default": {"kafka": [], "kusto": [], "mqtt": []}
            },
            "eventRoutes": {
                "type": "array",
                "title": "Event Routes",
                "items": {
                    "type": "object",
                    "properties": {
                        "sinkName": {"type": "string", "title": "Sink Name"},
                        "eventFormat": {"type": "string", "enum": ["EventNotification", "DataHistory"], "title": "Event Format"}
                    },
                    "required": ["sinkName", "eventFormat"]
                },
                "default": []
            },
            "database": {
                "type": "object",
                "title": "Database Configuration",
                "properties": {
                    "storageClass": {"type": "string", "default": "standard", "title": "Storage Class"},
                    "storageSize": {"type": "string", "default": "10Gi", "title": "Storage Size"},
                    "backupEnabled": {"type": "boolean", "default": true, "title": "Enable Backups"}
                },
                "default": {"storageClass": "standard", "storageSize": "10Gi", "backupEnabled": true}
            }
        },
        "required": ["instances"]
    }'::jsonb,
    '{
        "helmChart": "agedigitaltwins",
        "chartVersion": ">=1.0.0",
        "repository": "https://charts.konnektr.io",
        "dependencies": ["postgresql-operator"],
        "healthChecks": [
            {
                "type": "http",
                "path": "/health",
                "port": 8080,
                "initialDelaySeconds": 30,
                "periodSeconds": 10
            },
            {
                "type": "http",
                "path": "/alive", 
                "port": 8080,
                "initialDelaySeconds": 10,
                "periodSeconds": 5
            }
        ],
        "resources": {
            "requests": {"memory": "512Mi", "cpu": "250m"},
            "limits": {"memory": "2Gi", "cpu": "1000m"}
        }
    }'::jsonb,
    true
),
(
    'Konnektr.Flows',
    'Konnektr Flows',
    'Workflow and data flow orchestration platform',
    'workflow',
    '{
        "type": "object",
        "properties": {
            "replicas": {
                "type": "number",
                "minimum": 1,
                "maximum": 10,
                "default": 2,
                "title": "Number of Replicas"
            },
            "persistence": {
                "type": "object",
                "title": "Persistence Configuration",
                "properties": {
                    "enabled": {"type": "boolean", "default": true},
                    "storageClass": {"type": "string", "default": "standard"},
                    "size": {"type": "string", "default": "5Gi"}
                }
            },
            "ingress": {
                "type": "object",
                "title": "Ingress Configuration", 
                "properties": {
                    "enabled": {"type": "boolean", "default": false},
                    "hostname": {"type": "string", "title": "Hostname"},
                    "tls": {"type": "boolean", "default": false}
                }
            }
        },
        "required": ["replicas"]
    }'::jsonb,
    '{
        "helmChart": "konnektr-flows",
        "chartVersion": ">=0.1.0",
        "repository": "https://charts.konnektr.io",
        "dependencies": [],
        "healthChecks": [
            {
                "type": "http",
                "path": "/api/health",
                "port": 3000,
                "initialDelaySeconds": 20,
                "periodSeconds": 10
            }
        ],
        "resources": {
            "requests": {"memory": "256Mi", "cpu": "100m"},
            "limits": {"memory": "1Gi", "cpu": "500m"}
        }
    }'::jsonb,
    true
);

-- Add deployment tracking to existing resources (if any)
INSERT INTO ktrlplane.resource_deployments (deployment_id, resource_id, status)
SELECT 
    CONCAT('deploy-', resource_id), 
    resource_id, 
    'unknown'
FROM ktrlplane.resources r
WHERE NOT EXISTS (
    SELECT 1 FROM ktrlplane.resource_deployments rd 
    WHERE rd.resource_id = r.resource_id
);
