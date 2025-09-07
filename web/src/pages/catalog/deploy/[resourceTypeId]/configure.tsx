import { useParams, useNavigate } from 'react-router-dom';
import { resourceTypes } from '@/features/catalog/resourceTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function CatalogConfigurePage() {
  const { resourceTypeId } = useParams<{ resourceTypeId: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState({});
  const [isDeploying, setIsDeploying] = useState(false);

  const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);

  if (!resourceType) {
    return <div className="container mx-auto py-10">Resource type not found.</div>;
  }

  const handleDeploy = () => {
    setIsDeploying(true);
    // TODO: Call backend to create resource, org, project as needed
    setTimeout(() => {
      setIsDeploying(false);
      navigate('/projects'); // Or to the new resource page
    }, 1200);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Configure {resourceType.name}</CardTitle>
          <CardDescription>Set up your resource before deployment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TODO: Add dynamic configuration form based on resource type */}
          <div className="text-muted-foreground text-sm mb-4">(Configuration form coming soon...)</div>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? 'Deploying...' : 'Deploy Resource'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
