export interface Organization {
  org_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationData {
  id: string;
  name: string;
}

export interface UpdateOrganizationData {
  name: string;
}
