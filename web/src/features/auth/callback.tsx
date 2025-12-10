import { useAuth0 } from '@auth0/auth0-react';

export default function AuthCallbackPage() {
  const { isLoading, error } = useAuth0();

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
          <h2 className="text-xl font-semibold text-red-600">
            Authentication Error
          </h2>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <a
            href="https://konnektr.io"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to Konnektr.io
          </a>
        </div>
      </div>
    );
  }

  // Auth0 will handle the redirect via onRedirectCallback
  return null;
}
