// Relief Transaction Smart Contract
// This contract records shipment transactions on the Polygon blockchain

export const RELIEF_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_RELIEF_CONTRACT_ADDRESS as `0x${string}`) ||
  '0x0000000000000000000000000000000000000000';

// Simplified ABI for the ReliefTransaction contract
export const RELIEF_CONTRACT_ABI = [
  {
    type: 'event',
    name: 'TransactionRecorded',
    inputs: [
      { name: 'shipmentId', type: 'bytes32', indexed: true },
      { name: 'validator', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'metadata', type: 'string', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'recordTransaction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shipmentId', type: 'bytes32' },
      { name: 'metadata', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getTransaction',
    stateMutability: 'view',
    inputs: [{ name: 'shipmentId', type: 'bytes32' }],
    outputs: [
      { name: 'validator', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'metadata', type: 'string' },
      { name: 'exists', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'isValidator',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'validatorCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Type helper for the contract
export type ReliefTransactionContract = {
  address: `0x${string}`;
  abi: typeof RELIEF_CONTRACT_ABI;
};

export const reliefContract: ReliefTransactionContract = {
  address: RELIEF_CONTRACT_ADDRESS,
  abi: RELIEF_CONTRACT_ABI,
};
