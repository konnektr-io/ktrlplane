import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProject, useUpdateProject } from "../hooks/useProjectApi";

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    data: currentProject,
    isLoading,
    isError,
    error,
  } = useProject(projectId!);
  const updateProjectMutation = useUpdateProject(projectId!);

  // Editable state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Sync name/description state with currentProject when it changes
  useEffect(() => {
    setName(currentProject?.name || "");
    setDescription(currentProject?.description || "");
  }, [
    currentProject?.name,
    currentProject?.description,
    currentProject?.project_id,
  ]);

  const handleSave = async () => {
    updateProjectMutation.mutate(
      { name, description },
      {
        onSuccess: () => {
          setEditing(false);
        },
        onSettled: () => {
          // Optionally reset saving state if you add a spinner
        },
      }
    );
  };

  if (isLoading) {
    return <div>Loading project...</div>;
  }
  if (isError) {
    return (
      <div className="text-red-500">
        Error loading project: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">Manage project configuration</p>
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
              <p className="text-sm text-muted-foreground font-mono">
                {projectId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              {editing ? (
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {currentProject?.name || "Loading..."}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              {editing ? (
                <Input
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {currentProject?.description || "No description"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <p className="text-sm">{currentProject?.status || "Unknown"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm">
                {currentProject?.created_at?.toLocaleDateString() || "Unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProjectMutation.status === "pending"}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={updateProjectMutation.status === "pending"}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
