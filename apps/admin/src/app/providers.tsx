'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setApiClientBaseUrl } from '@wira-borneo/api-client';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from './components/Toast';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (apiBaseUrl) {
    setApiClientBaseUrl(apiBaseUrl);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
