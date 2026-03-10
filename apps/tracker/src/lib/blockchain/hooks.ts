import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { reliefContract } from './contracts';
import { blockExplorerUrl } from './config';
import { keccak256, toBytes } from 'viem';

/**
 * Hook to check if a shipment transaction has been verified on-chain
 */
export function useTransactionVerification(shipmentId: string | undefined) {
  // Convert shipmentId to bytes32 hash
  const shipmentHash = shipmentId ? keccak256(toBytes(shipmentId)) : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    ...reliefContract,
    functionName: 'getTransaction',
    args: shipmentHash ? [shipmentHash] : undefined,
    query: {
      enabled: !!shipmentHash,
    },
  });

  const isVerified = data ? data[3] : false; // exists boolean
  const validator = data ? data[0] : undefined;
  const timestamp = data ? data[1] : undefined;

  return {
    isVerified,
    validator,
    timestamp,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the list of validator addresses
 */
export function useValidatorNodes() {
  const { data: count } = useReadContract({
    ...reliefContract,
    functionName: 'validatorCount',
  });

  // In a real implementation, you'd fetch the list of validators
  // For now, returning mock data structure
  return {
    count: count ? Number(count) : 0,
    validators: [], // Would need additional contract methods to fetch actual list
  };
}

/**
 * Hook to record a shipment transaction on-chain
 */
export function useRecordShipment() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const recordShipment = async (shipmentId: string, metadata: string) => {
    const shipmentHash = keccak256(toBytes(shipmentId));

    writeContract({
      ...reliefContract,
      functionName: 'recordTransaction',
      args: [shipmentHash, metadata],
    });
  };

  const explorerUrl = hash ? `${blockExplorerUrl}/tx/${hash}` : undefined;

  return {
    recordShipment,
    hash,
    explorerUrl,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to check if connected wallet is a validator
 */
export function useIsValidator(address: `0x${string}` | undefined) {
  const { data: isValidator } = useReadContract({
    ...reliefContract,
    functionName: 'isValidator',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return isValidator || false;
}

/**
 * Hook to get network statistics from blockchain
 */
export function useNetworkStats() {
  const { data: validatorCount } = useReadContract({
    ...reliefContract,
    functionName: 'validatorCount',
  });

  // Mock stats - in real implementation, would query events or additional contract methods
  return {
    validatorCount: validatorCount ? Number(validatorCount) : 0,
    totalTransactions: 0, // Would need to query TransactionRecorded events
    networkTrustIndex: 99.98, // Mock value
  };
}
