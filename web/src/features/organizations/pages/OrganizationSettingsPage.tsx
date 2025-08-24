import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganizationStore } from '../store/organizationStore';

export default function OrganizationSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { currentOrganization, updateOrganization } = useOrganizationStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentOrganization?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateOrganization(orgId!, { name });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage organization configuration</p>
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
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              ) : (
                <p className="text-sm">{currentOrganization?.name || 'Loading...'}</p>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave} disabled={saving}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditing(true)}>Edit</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
