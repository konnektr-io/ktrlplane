import { useAuth0 } from '@auth0/auth0-react';
import { ReactNode, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  // Only render children if authenticated and not loading
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

  if (!isAuthenticated && !isLoading) {
    // Don't render anything while redirecting
    return null;
  }

  // Only render children if authenticated
  return <>{children}</>;
}
