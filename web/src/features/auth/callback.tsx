import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const { isLoading, error, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (error) {
      console.error('Auth0 callback error:', error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <a href="/login" className="mt-4 inline-block text-primary hover:underline">
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <Navigate to="/login" replace />;
}
