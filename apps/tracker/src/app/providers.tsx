'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '../lib/blockchain/config';
import { useState, useEffect } from 'react';
import { setApiClientBaseUrl } from '@wira-borneo/api-client';

export function Providers({ children }: { children: React.ReactNode }) {
  // Configure API client base URL
  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333';
    setApiClientBaseUrl(baseUrl);
  }, []);

  // Create QueryClient instance once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: '#193ce6',
              borderRadius: 'medium',
            }),
            darkMode: darkTheme({
              accentColor: '#193ce6',
              borderRadius: 'medium',
            }),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
