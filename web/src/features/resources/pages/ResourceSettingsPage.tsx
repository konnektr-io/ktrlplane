import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import { ResourceSettingsForm } from "../components/ResourceSettingsForm";
import { resourceSchemas, ResourceType } from "../schemas";
import { ZodObject, ZodRawShape } from "zod";
import { Button } from "@/components/ui/button";
import { useResource, useUpdateResource } from "../hooks/useResourceApi";
import type { UpdateResourceData } from "../types/resource.types";

export default function ResourceSettingsPage() {
  // ...existing code...
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
            {/* Show dynamic form if schema exists and has fields, else fallback */}
            {(() => {
              const type = currentResource?.type;
              const isKnownType =
                type && Object.keys(resourceSchemas).includes(type);
              const schema = isKnownType
                ? resourceSchemas[type as ResourceType]
                : undefined;
              const shape =
                schema && "shape" in schema
                  ? (schema as ZodObject<ZodRawShape>).shape
                  : undefined;
              // Show dynamic form if schema exists and has fields
              if (editing && schema && shape && Object.keys(shape).length > 0) {
                return (
                  <ResourceSettingsForm
                    resourceType={type as string}
                    projectId={projectId}
                    initialValues={
                      currentResource &&
                      typeof currentResource.settings_json === "string"
                        ? JSON.parse(currentResource.settings_json)
                        : currentResource?.settings_json || {}
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
              // Show summary if not editing and schema exists
              if (
                !editing &&
                schema &&
                shape &&
                Object.keys(shape).length > 0
              ) {
                return (
                  <div>
                    {Object.keys(shape).map((field) => {
                      let val = currentResource?.settings_json;
                      if (typeof val === "string") {
                        try {
                          val = JSON.parse(val);
                        } catch {
                          return (
                            <div key={field}>
                              <label className="text-sm font-medium">
                                {field}
                              </label>
                              <p className="text-sm font-mono mt-1">-</p>
                            </div>
                          );
                        }
                      }
                      return (
                        <div key={field}>
                          <label className="text-sm font-medium">{field}</label>
                          <p className="text-sm font-mono mt-1">
                            {val && typeof val === "object" && field in val
                              ? typeof val[field] === "object"
                                ? JSON.stringify(val[field], null, 2)
                                : String(val[field])
                              : "-"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              // If schema exists but has no fields (e.g. Flow), show message
              if (schema && shape && Object.keys(shape).length === 0) {
                return (
                  <div className="text-muted-foreground text-sm">
                    No configurable settings for this resource type.
                  </div>
                );
              }
              // Fallback for unknown types: show raw JSON
              if (currentResource && (!type || !isKnownType)) {
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
                const isKnownType =
                  type && Object.keys(resourceSchemas).includes(type);
                const schema = isKnownType
                  ? resourceSchemas[type as ResourceType]
                  : undefined;
                const shape =
                  schema && "shape" in schema
                    ? (schema as ZodObject<ZodRawShape>).shape
                    : undefined;
                const hasFormSchema =
                  schema && shape && Object.keys(shape).length > 0;

                if (editing && !hasFormSchema) {
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
