import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SignInPage = () => {
  const { loginWithGoogle, isAuthenticated, loading, initializing } = useAuth();
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const returnTo = typeof from?.pathname === 'string' && from.pathname.startsWith('/') && !from.pathname.startsWith('//') && from.pathname !== '/sign-in'
    ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/profile';

  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [fetchingConfig, setFetchingConfig] = useState(!import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!clientId) {
      api.get('/auth/client-id')
        .then(({ data }) => {
          if (data?.clientId) setClientId(data.clientId);
        })
        .catch(() => {})
        .finally(() => setFetchingConfig(false));
    }
  }, [clientId]);

  const handleSuccess = async ({ credential }) => {
    setError('');
    const result = await loginWithGoogle(credential);
    if (result.success) navigate(returnTo, { replace: true });
    else setError(result.error);
  };

  if (initializing) return <div className="container" style={{ padding: '64px 24px' }}>Checking your session...</div>;
  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  return (
    <section className="container" style={{ width: '100%', maxWidth: '460px', padding: '64px 24px 96px' }}>
      <BookOpen size={32} style={{ color: 'var(--primary)', marginBottom: '20px' }} />
      <h1 style={{ fontSize: '28px', marginBottom: '28px' }}>Sign in to BookNest</h1>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          <div aria-busy={loading} style={{ minHeight: '44px', pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
            <GoogleLogin onSuccess={handleSuccess} onError={() => setError('Google sign-in failed. Please try again.')} theme="outline" shape="rectangular" size="large" />
          </div>
        </GoogleOAuthProvider>
      ) : fetchingConfig ? (
        <p role="status">Loading sign-in options...</p>
      ) : (
        <p role="status">Google sign-in is currently unavailable. Please try again later.</p>
      )}
      {loading && <p role="status" style={{ marginTop: '16px' }}>Signing in...</p>}
      {error && <p role="alert" style={{ color: 'var(--danger)', marginTop: '16px' }}>{error}</p>}
      <Link to="/catalogue" className="btn btn-outline" style={{ marginTop: '32px' }}><ArrowLeft size={16} /> Continue browsing</Link>
    </section>
  );
};

export default SignInPage;