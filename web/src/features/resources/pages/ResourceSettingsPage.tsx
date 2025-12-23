import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import { ResourceSettingsForm } from "../components/ResourceSettingsForm";
import { Button } from "@/components/ui/button";
import { resourceTypes } from "../catalog/resourceTypes";
import { useResource, useUpdateResource } from "../hooks/useResourceApi";
import type { UpdateResourceData } from "../types/resource.types";
import type { GraphSettings } from "../schemas/GraphSchema";

function GraphSettingsSummary({ settings }: { settings: GraphSettings }) {
  const totalSinks =
    (settings.eventSinks?.kafka?.length || 0) +
    (settings.eventSinks?.kusto?.length || 0) +
    (settings.eventSinks?.mqtt?.length || 0) +
    (settings.eventSinks?.webhook?.length || 0);

  const totalRoutes = settings.eventRoutes?.length || 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Event Sinks</label>
        <p className="text-sm text-muted-foreground mt-1">
          {totalSinks === 0
            ? "No sinks configured"
            : `${totalSinks} sink(s) configured`}
        </p>
        {totalSinks > 0 && (
          <div className="mt-2 space-y-1 text-sm">
            {(settings.eventSinks?.kafka?.length || 0) > 0 && (
              <div>• Kafka: {settings.eventSinks.kafka.length}</div>
            )}
            {(settings.eventSinks?.kusto?.length || 0) > 0 && (
              <div>
                • Azure Data Explorer: {settings.eventSinks.kusto.length}
              </div>
            )}
            {(settings.eventSinks?.mqtt?.length || 0) > 0 && (
              <div>• MQTT: {settings.eventSinks.mqtt.length}</div>
            )}
            {(settings.eventSinks?.webhook?.length || 0) > 0 && (
              <div>• Webhook: {settings.eventSinks.webhook.length}</div>
            )}
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Event Routes</label>
        <p className="text-sm text-muted-foreground mt-1">
          {totalRoutes === 0
            ? "No routes configured"
            : `${totalRoutes} route(s) configured`}
        </p>
      </div>
    </div>
  );
}

export default function ResourceSettingsPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();
  const {
    data: currentResource,
    isLoading,
    error,
  } = useResource(projectId!, resourceId!);
  const updateResourceMutation = useUpdateResource(projectId!, resourceId!);
  // Permissions for resource (prefer resource, fallback to project)
  const { data: resourcePermissions = [] } = useUserPermissions(
    "resource",
    resourceId ?? ""
  );
  const { data: projectPermissions = [] } = useUserPermissions(
    "project",
    projectId ?? ""
  );
  const [editing, setEditing] = useState(false);
  const [settingsJson, setSettingsJson] = useState(
    currentResource?.settings_json
      ? JSON.stringify(currentResource.settings_json, null, 2)
      : "{}"
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validate JSON
    try {
      JSON.parse(settingsJson);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON");
      return;
    }
    setSaving(true);
    const payload: UpdateResourceData = {
      settings_json: JSON.parse(settingsJson),
    };
    await updateResourceMutation.mutateAsync(payload);
    setSaving(false);
    setEditing(false);
  };

  // Only allow editing if user has 'write' on resource or project
  const canEdit =
    resourcePermissions?.includes("write") ||
    projectPermissions?.includes("write");

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
      <div>
        <h1 className="text-2xl font-bold">Advanced Settings</h1>
        <p className="text-muted-foreground">
          Configure advanced resource-specific settings
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Advanced settings for {currentResource?.type || "this resource"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const type = currentResource?.type;
              const resourceTypeDef = resourceTypes.find(
                (rt) => rt.id === type
              );
              const hasSettings = resourceTypeDef?.settingsReady;

              // Show form when editing and settings are available
              if (editing && hasSettings) {
                return (
                  <ResourceSettingsForm
                    resourceType={type as string}
                    projectId={projectId}
                    onSubmit={async (values) => {
                      setSaving(true);
                      const payload: UpdateResourceData = {
                        settings_json: values as Record<string, unknown>,
                      };
                      await updateResourceMutation.mutateAsync(payload);
                      setSaving(false);
                      setEditing(false);
                    }}
                    disabled={saving}
                  />
                );
              }

              // Show summary when not editing and settings are available
              if (!editing && hasSettings) {
                // Special display for Graph resources
                if (type === "Konnektr.Graph") {
                  const graphSettings =
                    currentResource?.settings_json as GraphSettings;
                  return (
                    <GraphSettingsSummary
                      settings={
                        graphSettings || {
                          eventSinks: {
                            kafka: [],
                            kusto: [],
                            mqtt: [],
                            webhook: [],
                          },
                          eventRoutes: [],
                        }
                      }
                    />
                  );
                }

                // Generic summary for other resource types
                return (
                  <div className="text-sm text-muted-foreground">
                    Settings configured. Click Edit to modify.
                  </div>
                );
              }

              // No settings UI available - show raw JSON fallback
              if (!hasSettings && currentResource) {
                return (
                  <div>
                    <label className="text-sm font-medium">
                      Deployment Settings (Raw JSON)
                    </label>
                    {editing ? (
                      <textarea
                        className="font-mono text-xs mt-1 w-full border rounded p-2"
                        rows={8}
                        value={settingsJson}
                        onChange={(e) => setSettingsJson(e.target.value)}
                      />
                    ) : (
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mt-1">
                        {settingsJson}
                      </pre>
                    )}
                  </div>
                );
              }

              return null;
            })()}
            <div className="flex gap-2 mt-2">
              {(() => {
                const type = currentResource?.type;
                const resourceTypeDef = resourceTypes.find(
                  (rt) => rt.id === type
                );
                const hasSettings = resourceTypeDef?.settingsReady;

                if (editing && !hasSettings) {
                  return (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !!jsonError}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </>
                  );
                } else if (!editing) {
                  return (
                    <Button
                      size="sm"
                      onClick={() => setEditing(true)}
                      disabled={!canEdit}
                      title={
                        !canEdit
                          ? "You do not have permission to edit this resource"
                          : undefined
                      }
                    >
                      Edit
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
