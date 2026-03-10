'use client';

import { useState } from 'react';
import { useTrackerControllerGetShipments, TrackerShipmentDto } from '@wira-borneo/api-client';

interface ShipmentTableProps {
  status: 'dispatched' | 'in_transit' | 'delivered';
}

export function ShipmentTable({ status }: ShipmentTableProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Map status to enum values
  const statusMap = {
    dispatched: 'DISPATCHED',
    in_transit: 'IN_TRANSIT',
    delivered: 'DELIVERED',
  };

  const { data, isLoading } = useTrackerControllerGetShipments(
    {
      status: statusMap[status],
    },
    {
      query: { refetchInterval: 30000 },
    },
  );
  const shipments = (data ?? []) as TrackerShipmentDto[];

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading shipments...</div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No shipments found for this status.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/50">
              <th className="px-6 py-5 font-semibold">Shipment ID</th>
              <th className="px-6 py-5 font-semibold">Origin & Destination</th>
              <th className="px-6 py-5 font-semibold">Blockchain Hash</th>
              <th className="px-6 py-5 font-semibold">Timestamp (UTC)</th>
              <th className="px-6 py-5 font-semibold">Verification</th>
              <th className="px-6 py-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {shipments.map((shipment) => (
              <tr
                key={shipment.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {shipment.shipmentId}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Class: {shipment.class}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{shipment.origin}</span>
                    <span className="material-symbols-outlined text-xs text-slate-300">
                      trending_flat
                    </span>
                    <span className="font-medium">{shipment.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary">
                      {shipment.blockchainHash || 'N/A'}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(shipment.blockchainHash || '')
                      }
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title={
                        copiedHash === shipment.blockchainHash
                          ? 'Copied!'
                          : 'Copy hash'
                      }
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        {copiedHash === shipment.blockchainHash
                          ? 'check'
                          : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500">
                    {formatTimestamp(shipment.timestamp)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {shipment.verificationStatus === 'VERIFIED' ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-full w-fit">
                      <span className="material-symbols-outlined text-[14px] fill-1">
                        verified
                      </span>
                      VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full w-fit">
                      <span className="material-symbols-outlined text-[14px]">
                        pending
                      </span>
                      PENDING
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:underline text-sm font-semibold">
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-400">
          Showing 1-10 of {shipments.length} {status} shipments
        </span>
        <div className="flex gap-2">
          <button className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-lg">
              chevron_left
            </span>
          </button>
          <button className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-lg">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
