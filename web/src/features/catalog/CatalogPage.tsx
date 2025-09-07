import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resourceTypes } from './resourceTypes';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useProjectStore } from '@/features/projects/store/projectStore';
import { useOrganizationStore } from '@/features/organizations/store/organizationStore';
import { useEffect } from 'react';

export default function CatalogPage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { projects, fetchProjects } = useProjectStore();
  const { fetchOrganizations } = useOrganizationStore();
  const navigate = useNavigate();

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
      fetchProjects();
    }
  }, [isAuthenticated, fetchOrganizations, fetchProjects]);

  const handleDeploy = (resourceTypeId: string) => {
    if (!isAuthenticated) {
      // Store where we want to go after auth - fallback to projects if no projects exist yet
      loginWithRedirect({
        appState: { 
          returnTo: projects.length > 0 
            ? `/projects/${projects[0].project_id}/resources/create?resourceType=${resourceTypeId}`
            : `/projects?resourceType=${resourceTypeId}`
        }
      });
    } else if (projects.length === 0) {
      // No projects, go to projects page to create one first
      navigate(`/projects?resourceType=${resourceTypeId}`);
    }
    // If authenticated and have projects, the Link component handles navigation
  };
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Resource Catalog</h1>
      <p className="text-muted-foreground mb-8">
        Explore and deploy resources. Click a card to learn more or start deploying.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {resourceTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-7 w-7 text-primary" />
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </div>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between gap-4">
                <div className="mb-2">
                  <ul className="text-xs text-muted-foreground list-disc pl-5">
                    {type.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  {isAuthenticated && projects.length > 0 ? (
                    <Button asChild variant="default">
                      <Link to={`/projects/${projects[0].project_id}/resources/create?resourceType=${type.id}`}>
                        Deploy Now
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="default"
                      onClick={() => handleDeploy(type.id)}
                    >
                      {isAuthenticated ? 'Create Project First' : 'Sign In to Deploy'}
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <a href={type.documentationUrl} target="_blank" rel="noopener noreferrer">View Documentation</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
