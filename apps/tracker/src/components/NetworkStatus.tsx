'use client';

import { useAccount, useBlockNumber } from 'wagmi';
import { targetChain } from '../lib/blockchain/config';

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`size-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
        }`}
      ></span>
      <span className="font-medium">
        {isConnected ? `${targetChain.name} Connected` : 'Not Connected'}
      </span>
      {blockNumber && (
        <span className="text-slate-500">• Block {blockNumber.toString()}</span>
      )}
    </div>
  );
}
