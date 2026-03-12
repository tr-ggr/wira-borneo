'use client';

import React, { useState } from 'react';
import { useAuthControllerSignUp, getAuthControllerGetSessionQueryKey } from '@wira-borneo/api-client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function Register({ onToggleLogin }: { onToggleLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [pregnantStatus, setPregnantStatus] = useState(false);
  const [isPWD, setIsPWD] = useState(false);
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
    signUp.mutate({ 
      data: { 
        name, 
        email, 
        password,
        ...(ageGroup ? { ageGroup: ageGroup as any } : {}),
        pregnantStatus,
        isPWD,
      } as any
    });
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

        <div className="space-y-3 pt-2">
          <label className="text-xs font-body font-semibold uppercase tracking-wider text-wira-teal text-left block">Demographics</label>
          <select 
            className="w-full bg-white border border-wira-ivory-dark rounded-xl px-4 py-3 font-body focus:ring-2 focus:ring-wira-gold outline-none text-sm"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            <option value="">Age Group (Optional)</option>
            <option value="UNDER_12">Under 12</option>
            <option value="AGE_12_17">12 - 17</option>
            <option value="AGE_18_59">18 - 59</option>
            <option value="AGE_60_PLUS">60+</option>
          </select>

          <label className="flex items-center justify-between p-3 rounded-xl border border-wira-ivory-dark bg-white">
            <span className="text-sm font-body text-wira-earth">Pregnant</span>
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-2 border-sagip-slate text-wira-teal accent-wira-teal focus:ring-wira-teal/30"
              checked={pregnantStatus}
              onChange={(e) => setPregnantStatus(e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-wira-ivory-dark bg-white">
            <span className="text-sm font-body text-wira-earth">Person with Disability (PWD)</span>
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-2 border-sagip-slate text-wira-teal accent-wira-teal focus:ring-wira-teal/30"
              checked={isPWD}
              onChange={(e) => setIsPWD(e.target.checked)}
            />
          </label>
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
