import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CatalogSetupPage() {
  const { resourceTypeId } = useParams<{ resourceTypeId: string }>();
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [projectName, setProjectName] = useState('');

  // TODO: If user is authenticated and has orgs/projects, show selection
  // For now, just show create form

  const handleContinue = () => {
    // TODO: Call backend to create org/project if needed
    // For now, just go to configuration step
    navigate(`/catalog/deploy/${resourceTypeId}/configure`);
  };

  return (
    <div className="container mx-auto py-10 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Set Up Organization & Project</CardTitle>
          <CardDescription>
            {isAuthenticated
              ? 'Create or select your organization and project.'
              : 'Create an organization and project to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. My Company"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Production"
            />
          </div>
          <Button onClick={handleContinue} disabled={!orgName.trim() || !projectName.trim()}>
            Continue to Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
