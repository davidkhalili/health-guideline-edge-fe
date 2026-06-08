'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

interface OptionalGoogleOAuthProviderProps {
  children: React.ReactNode;
}

export function OptionalGoogleOAuthProvider({ children }: OptionalGoogleOAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return <>{children}</>;
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
