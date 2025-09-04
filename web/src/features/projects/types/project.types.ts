export interface Project {
  project_id: string;
  org_id?: string;
  name: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}
