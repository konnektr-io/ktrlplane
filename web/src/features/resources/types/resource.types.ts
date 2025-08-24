export interface Resource {
  resource_id: string;
  project_id: string;
  name: string;
  type: string;
  status: string;
  settings_json: Record<string, any>; // Always an object
  created_at: Date;
  updated_at: Date;
  error_message?: string;
  access_url?: string;
}

export interface CreateResourceData {
  name: string;
  type: string;
  settings_json?: Record<string, any>;
}

export interface UpdateResourceData {
  name?: string;
  settings_json?: Record<string, any>;
}
