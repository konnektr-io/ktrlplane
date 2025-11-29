
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganization, useUpdateOrganization } from '../hooks/useOrganizationApi';

export default function OrganizationSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const {
    data: currentOrganization,
    isLoading,
    isError,
  } = useOrganization(orgId!);
  const updateOrganizationMutation = useUpdateOrganization(orgId!);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(currentOrganization?.name || "");
  }, [currentOrganization?.name]);

  const handleSave = async () => {
    updateOrganizationMutation.mutate(
      { name },
      {
        onSuccess: () => {
          setEditing(false);
        },
      }
    );
  };

  if (isLoading) {
    return <div>Loading organization...</div>;
  }
  if (!currentOrganization || isError) {
    return <div className="text-red-500">Organization not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage organization configuration
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Basic organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Organization ID</label>
              <p className="text-sm text-muted-foreground font-mono">{orgId}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {currentOrganization?.name || "Loading..."}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateOrganizationMutation.status === "pending"}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={updateOrganizationMutation.status === "pending"}
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
