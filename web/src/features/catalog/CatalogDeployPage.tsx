import { useParams, useNavigate } from 'react-router-dom';
import { resourceTypes } from './resourceTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth0 } from '@auth0/auth0-react';
import { useOrganizationStore } from '@/features/organizations/store/organizationStore';
import { useProjectStore } from '@/features/projects/store/projectStore';
import { useEffect } from 'react';

export default function CatalogDeployPage() {
  const { resourceTypeId } = useParams<{ resourceTypeId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { organizations, fetchOrganizations } = useOrganizationStore();
  const { projects, fetchProjects } = useProjectStore();

  const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);

  // Fetch organizations and projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    }
  }, [isAuthenticated, fetchOrganizations]);

  // Fetch projects for the first organization
  useEffect(() => {
    if (organizations.length > 0) {
      fetchProjects();
    }
  }, [organizations, fetchProjects]);

  // Auto-redirect to resource creation after authentication
  useEffect(() => {
    if (isAuthenticated && projects.length > 0) {
      // Check if we just returned from authentication
      const urlParams = new URLSearchParams(window.location.search);
      const fromAuth = urlParams.has('code') || urlParams.has('state');
      
      if (fromAuth) {
        // Redirect to create resource with the first project
        navigate(`/projects/${projects[0].project_id}/resources/create?resourceType=${resourceTypeId}`);
      }
    }
  }, [isAuthenticated, projects, resourceTypeId, navigate]);

  if (!resourceType) {
    return <div className="container mx-auto py-10">Resource type not found.</div>;
  }

  const handleStart = () => {
    if (!isAuthenticated) {
      // Use Auth0's appState to store the return URL
      loginWithRedirect({
        appState: { 
          returnTo: `/catalog/deploy/${resourceTypeId}` 
        }
      });
    } else if (projects.length > 0) {
      // If user has projects, redirect to create resource with the first project
      navigate(`/projects/${projects[0].project_id}/resources/create?resourceType=${resourceTypeId}`);
    } else {
      // If no projects, redirect to projects page to create one first
      navigate('/projects');
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <resourceType.icon className="h-7 w-7 text-primary" />
            <CardTitle className="text-xl">{resourceType.name}</CardTitle>
          </div>
          <CardDescription>{resourceType.longDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Features</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 mb-2">
              {resourceType.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Available Tiers</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              {resourceType.skus.map((tier) => (
                <li key={tier.sku}><span className="font-medium">{tier.name}:</span> {tier.price}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={handleStart} size="lg" className="flex-1">
              {isAuthenticated ? 'Start Deployment →' : 'Sign In to Deploy'}
            </Button>
            <Button asChild variant="outline">
              <a href={resourceType.documentationUrl} target="_blank" rel="noopener noreferrer">View Documentation</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
