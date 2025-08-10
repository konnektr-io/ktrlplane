import { useParams } from 'react-router-dom';
import { useOrganizationStore } from '../store/organizationStore';
import { useProjectStore } from '../../projects/store/projectStore';
import { Project } from '../../projects/types/project.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Building2, FolderOpen } from 'lucide-react';

export default function OrganizationOverviewPage() {
  const { orgId } = useParams();
  const { currentOrganization } = useOrganizationStore();
  const { projects } = useProjectStore();

  // Filter projects for this organization if needed
  const orgProjects = projects.filter((project: Project) => project.org_id === orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{currentOrganization?.name || 'Organization Overview'}</h1>
        <p className="text-muted-foreground">
          Organization details and management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Organization Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {currentOrganization?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Organization ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {currentOrganization?.org_id || orgId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Total Projects</p>
              <p className="text-2xl font-bold">{orgProjects.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Active Projects</p>
              <p className="text-lg font-semibold text-green-600">
                {orgProjects.filter((p: Project) => p.status === 'Active').length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentOrganization?.created_at && (
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentOrganization.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {currentOrganization?.updated_at && (
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentOrganization.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {orgProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Projects in this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgProjects.slice(0, 5).map((project: Project) => (
                <div key={project.project_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Metrics</CardTitle>
          <CardDescription>
            High-level organization statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{orgProjects.length}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
