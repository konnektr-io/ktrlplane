import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setupAuthInterceptor } from '../../lib/axios';

export default function AuthSetup({ children }: { children: React.ReactNode }) {
  const { getAccessTokenSilently, getAccessTokenWithPopup } = useAuth0();

  useEffect(() => {
    setupAuthInterceptor(getAccessTokenSilently, getAccessTokenWithPopup);
  }, [getAccessTokenSilently]);

  return <>{children}</>;
}
