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
import * as React from 'react';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});



export function Providers({ children }: { children: React.ReactNode }) {
  
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
