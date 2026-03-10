import { http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Determine which chain to use based on environment
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
  : 80002;

export const targetChain = chainId === 137 ? polygon : polygonAmoy;

// RainbowKit configuration
export const wagmiConfig = getDefaultConfig({
  appName: 'ASEAN Relief Tracker',
  projectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  chains: [targetChain] as const,
  transports: {
    [polygonAmoy.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL ||
        'https://rpc-amoy.polygon.technology',
    ),
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    ),
  },
  ssr: true,
});

export const blockExplorerUrl =
  chainId === 137 ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com';
