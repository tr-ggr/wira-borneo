'use client';

import React, { useState } from 'react';
import { useAuthControllerSignUp, getAuthControllerGetSessionQueryKey } from '@wira-borneo/api-client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function Register({ onToggleLogin }: { onToggleLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const signUp = useAuthControllerSignUp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthControllerGetSessionQueryKey() });
        router.refresh();
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'Pendaftaran gagal. Sila cuba lagi.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    signUp.mutate({ data: { name, email, password } });
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-fade-in">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-display font-bold text-wira-teal">Create Account</h1>
        <p className="text-sm font-body text-wira-earth">Join the WIRA community for regional safety</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-body font-semibold uppercase tracking-wider text-wira-teal">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-wira-ivory-dark rounded-xl px-4 py-3 font-body focus:ring-2 focus:ring-wira-gold outline-none transition-all"
            placeholder="Your name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-body font-semibold uppercase tracking-wider text-wira-teal">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-wira-ivory-dark rounded-xl px-4 py-3 font-body focus:ring-2 focus:ring-wira-gold outline-none transition-all"
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-body font-semibold uppercase tracking-wider text-wira-teal">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-wira-ivory-dark rounded-xl px-4 py-3 font-body focus:ring-2 focus:ring-wira-gold outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-status-critical/10 border border-status-critical/20 text-status-critical text-xs p-3 rounded-lg font-body">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={signUp.isPending}
          className="wira-btn-primary mt-4 flex items-center justify-center"
        >
          {signUp.isPending ? 'Processing...' : 'Register Now'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={onToggleLogin}
          className="text-sm font-body text-wira-teal-light hover:text-wira-teal transition-colors"
        >
          Already have an account? <span className="font-bold">Log in</span>
        </button>
      </div>
    </div>
  );
}
