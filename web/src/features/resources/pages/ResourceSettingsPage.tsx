import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from "react";
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import { ResourceSettingsForm } from "../components/ResourceSettingsForm";
import { Button } from "@/components/ui/button";
import { resourceTypes } from "../catalog/resourceTypes";
import { useResource, useUpdateResource } from "../hooks/useResourceApi";
import type { UpdateResourceData } from "../types/resource.types";
import type { GraphSettings } from "../schemas/GraphSchema";

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
  const [settingsJson, setSettingsJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Update settingsJson when resource data loads
  useEffect(() => {
    if (currentResource?.settings_json) {
      setSettingsJson(JSON.stringify(currentResource.settings_json, null, 2));
    }
  }, [currentResource?.settings_json]);

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

  // Handler for structured form saves (used by GraphForm per-item saves)
  const handleFormSave = async (
    values: GraphSettings | Record<string, unknown>
  ) => {
    const payload: UpdateResourceData = {
      settings_json: values as Record<string, unknown>,
    };
    await updateResourceMutation.mutateAsync(payload);
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

  const type = currentResource?.type;
  const resourceTypeDef = resourceTypes.find((rt) => rt.id === type);
  const hasSettings = resourceTypeDef?.hasSettings;

  // For Graph resources: always show the form directly (no edit toggle)
  // because each sink/route has its own save button
  if (type === "Konnektr.Graph" && hasSettings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Event Routing Configuration</h1>
          <p className="text-muted-foreground">
            Configure event sinks and routing for your Graph resource
          </p>
        </div>
        <ResourceSettingsForm
          resourceType={type}
          projectId={projectId}
          initialValues={currentResource?.settings_json as GraphSettings}
          onSubmit={handleFormSave}
          disabled={!canEdit}
        />
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            You do not have permission to edit this resource.
          </p>
        )}
      </div>
    );
  }

  // For other resource types: show with edit toggle
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
              // Show form when editing and settings are available
              if (editing && hasSettings) {
                return (
                  <ResourceSettingsForm
                    resourceType={type as string}
                    projectId={projectId}
                    initialValues={
                      currentResource?.settings_json as Record<string, unknown>
                    }
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

