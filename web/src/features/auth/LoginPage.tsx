import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (isAuthenticated) {
      return;
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  const handleLogin = () => {
    loginWithRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <img 
            src="https://konnektr.io/assets/konnektr-DaFD7oiA.svg" 
            alt="Konnektr" 
            className="mx-auto h-12 w-auto mb-6"
          />
          <h2 className="text-3xl font-bold">Welcome to ktrlplane</h2>
          <p className="mt-2 text-muted-foreground">
            Your cloud platform control plane
          </p>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your projects and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
