export interface Resource {
  resource_id: string;
  project_id: string;
  name: string;
  type: string;
  sku: string; // Billing tier/sku
  status: string;
  settings_json: Record<string, any>; // Always an object
  created_at: Date;
  updated_at: Date;
  error_message?: string;
  access_url?: string;
}

export interface CreateResourceData {
  id: string;
  name: string;
  type: string;
  sku?: string; // Optional, defaults to 'free'
  settings_json?: Record<string, any>;
}

export interface UpdateResourceData {
  name?: string;
  sku?: string; // Allow updating the SKU/tier
  settings_json?: Record<string, any>;
}
