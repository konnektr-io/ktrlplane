import { useParams } from 'react-router-dom';
import { useResource } from "../hooks/useResourceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Database, Activity } from "lucide-react";
import { ResourceStatusBadge } from "../components/ResourceStatusBadge";
import { ResourceDetailsPanel } from "../components/ResourceDetailsPanel";

export default function ResourceDetailPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();
  const {
    data: currentResource,
    isLoading,
    error,
  } = useResource(projectId!, resourceId!);

  if (isLoading) {
    return <div>Loading resource...</div>;
  }
  if (error) {
    return (
      <div className="text-red-500">
        Error: {error.message || String(error)}
      </div>
    );
  }

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
        {/* Resource-specific quick actions (e.g., Open Graph Explorer) will go here */}
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
              <ResourceStatusBadge status={currentResource?.status} />
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
            {/* Resource-type-specific details will go here (see ResourceDetailsPanel below) */}
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

      {/* Resource-type-specific details panel */}
      {currentResource && <ResourceDetailsPanel resource={currentResource} />}

      {/*
        Future resource-specific cards:
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with your resource</CardDescription>
          </CardHeader>
          <CardContent>
            // Quick start instructions, onboarding links, etc.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Links to API docs, guides, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            // Documentation links, API reference, etc.
          </CardContent>
        </Card>
      */}
    </div>
  );
}
