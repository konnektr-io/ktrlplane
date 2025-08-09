import { useParams } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProjectStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">Manage project configuration and billing</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Basic project details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project ID</label>
              <p className="text-sm text-muted-foreground font-mono">{projectId}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm">{currentProject?.name || 'Loading...'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm">{currentProject?.description || 'No description'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <p className="text-sm">{currentProject?.status || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm">
                {currentProject?.created_at?.toLocaleDateString() || 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Billing and cost management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Billing integration coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Manage project members and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              RBAC configuration coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
