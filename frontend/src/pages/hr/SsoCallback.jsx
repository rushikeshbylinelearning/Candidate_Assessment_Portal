import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * SSO callback — receives ?token=&user= from the backend redirect,
 * stores them, and sends the user to the HR dashboard.
 *
 * Pattern mirrors: candidate-assessment-portal/frontend/src/pages/hr/SsoCallback.jsx
 */
export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    const ssoError = searchParams.get('error');
    const ssoMessage = searchParams.get('message');
    if (ssoError) {
      setError(ssoMessage ? decodeURIComponent(ssoMessage) : 'SSO login failed.');
      return;
    }

    if (!token || !userRaw) {
      setError('SSO callback is missing required parameters.');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      loginWithToken(token, user);
      navigate('/hr/dashboard', { replace: true });
    } catch {
      setError('Failed to complete SSO login. Please try again.');
    }
  }, [searchParams, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md text-center max-w-sm w-full">
          <p className="mb-4 text-red-600 font-medium">{error}</p>
          <a
            href="/login"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p>Completing sign-in…</p>
      </div>
    </div>
  );
}
