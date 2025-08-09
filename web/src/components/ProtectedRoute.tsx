import React from 'react';

export default function ProtectedRoute() {
  // TODO: Implement actual authentication check
  // For now, we'll assume the user is authenticated for development
  return <div>Loading...</div>;
}

// Simplified for development - just pass through
export function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
