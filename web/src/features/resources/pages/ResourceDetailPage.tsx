import { useParams } from 'react-router-dom';
import { useResourceStore } from '../store/resourceStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Database, Activity, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResourceDetailPage() {
  const { resourceId } = useParams();
  const { resources } = useResourceStore();
  
  // Find the current resource
  const currentResource = resources.find(r => r.resource_id === resourceId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {currentResource?.name || "Resource Overview"}
          </h1>
          <p className="text-muted-foreground">
            Resource details and configuration
          </p>
        </div>
        {currentResource?.access_url && (
          <Button variant="outline" asChild>
            <a
              href={currentResource.access_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resource
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Resource Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Resource Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge
                variant={
                  currentResource?.status === "Healthy"
                    ? "default"
                    : currentResource?.status === "Creating"
                    ? "secondary"
                    : "destructive"
                }
              >
                {currentResource?.status || "Unknown"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Type</p>
              <p className="text-sm text-muted-foreground">
                {currentResource?.type || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Resource ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {currentResource?.resource_id || resourceId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Current Status</p>
              <p className="text-sm text-muted-foreground">
                {currentResource?.status || "Unknown"}
              </p>
            </div>
            {currentResource?.error_message && (
              <div>
                <p className="text-sm font-medium text-red-600">
                  Error Message
                </p>
                <p className="text-sm text-red-500">
                  {currentResource.error_message}
                </p>
              </div>
            )}
            {currentResource?.access_url && (
              <div>
                <p className="text-sm font-medium">Access URL</p>
                <a
                  href={currentResource.access_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {currentResource.access_url}
                </a>
              </div>
            )}
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
            {currentResource?.created_at && (
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentResource.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {currentResource?.updated_at && (
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentResource.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Card */}
      {currentResource?.settings_json && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </CardTitle>
            <CardDescription>
              Resource configuration and Helm values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(currentResource.settings_json, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Metrics</CardTitle>
          <CardDescription>
            Resource usage and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">CPU Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Memory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
