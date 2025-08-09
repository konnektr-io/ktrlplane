import { z } from 'zod';
import { organizationSchema, projectSchema, resourceSchema, createProjectSchema, updateProjectSchema, createResourceSchema, updateResourceSchema } from './zodSchemas';

export type Organization = z.infer<typeof organizationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Resource = z.infer<typeof resourceSchema>;

export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type CreateResourceData = z.infer<typeof createResourceSchema>;
export type UpdateResourceData = z.infer<typeof updateResourceSchema>;


// Example User type (adapt based on Auth0 claims)
export interface User {
  id: string; // subject from token
  email?: string;
  name?: string;
  picture?: string;
}