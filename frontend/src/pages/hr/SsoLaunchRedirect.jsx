import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function resolveBackendSsoLoginUrl(token) {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const backendOrigin = apiBase.startsWith('http')
    ? apiBase.replace(/\/api\/?$/, '')
    : window.location.origin;
  return `${backendOrigin}/sso-login?token=${encodeURIComponent(token)}`;
}

/**
 * Frontend fallback when /sso-login is served by the SPA.
 * Delegates to the backend GET /sso-login route (same pattern as AMS).
 */
export default function SsoLaunchRedirect() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      window.location.replace(resolveBackendSsoLoginUrl(token));
      return;
    }
    window.location.replace(
      `/login?error=sso_error&message=${encodeURIComponent('SSO token is required')}`,
    );
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p>Completing sign-in…</p>
      </div>
    </div>
  );
}
