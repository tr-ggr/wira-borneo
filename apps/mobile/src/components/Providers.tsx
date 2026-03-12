'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { I18nProvider } from '../i18n/context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return false;
        }

        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const persister = React.useMemo(
    () =>
      createSyncStoragePersister({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        key: 'wira-mobile-query-cache',
      }),
    [],
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const [firstKey] = query.queryKey;

            return !(typeof firstKey === 'string' && firstKey.includes('/api/auth/session'));
          },
        },
      }}
    >
      <I18nProvider>
        {children}
      </I18nProvider>
    </PersistQueryClientProvider>
  );
}
