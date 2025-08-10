export interface Resource {
  resource_id: string;
  project_id: string;
  name: string;
  type: string;
  status: string;
  helm_values: Record<string, any> | string; // Can be object or JSON string
  created_at: Date;
  updated_at: Date;
  error_message?: string;
  access_url?: string;
}

export interface CreateResourceData {
  name: string;
  type: string;
  helm_values?: Record<string, any>;
}

export interface UpdateResourceData {
  name?: string;
  helm_values?: Record<string, any>;
}
