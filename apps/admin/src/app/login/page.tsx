'use client';

import { useState } from 'react';
import { useAuthControllerSignIn } from '@wira-borneo/api-client';
import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { mutateAsync: signIn, isPending } = useAuthControllerSignIn();
  const { isLoading: isStatusLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await signIn({
        data: {
          email,
          password,
        },
      });
      // AuthProvider effect will handle redirecting upon session detection
      window.location.href = '/'; 
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Invalid email or password / Emel atau kata laluan tidak sah');
    }
  };

  if (isStatusLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="login-container">
      <div className="card login-card">
        <header className="section-header">
          <p className="eyebrow">WIRA Admin Access</p>
          <h1 className="title">Login / Log Masuk</h1>
          <p className="subtitle">
            Secure administrative access only.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label">
            Email / Emel
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@bornea.wira"
            />
          </label>

          <label className="field-label">
            Password / Kata Laluan
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-text mb-4">{error}</p>}

          <button
            type="submit"
            className="btn btn-warning w-full mt-4"
            disabled={isPending}
          >
            {isPending ? 'Logging in...' : 'Login / Log Masuk'}
          </button>
        </form>

        <p className="small muted mt-6">
          Woven Intelligence for Regional Alertness (WIRA) - Admin Console
        </p>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 48px);
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
        }
        .w-full {
          width: 100%;
        }
        .mb-4 {
          margin-bottom: 1rem;
        }
        .mt-4 {
          margin-top: 1rem;
        }
        .mt-6 {
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
