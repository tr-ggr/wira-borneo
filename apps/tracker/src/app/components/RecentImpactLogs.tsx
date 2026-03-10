'use client';

import { useTrackerControllerGetShipments } from '@wira-borneo/api-client';

interface TrackerShipment {
  id: string;
  shipmentId: string;
  class: string;
  destination: string;
  verificationStatus: string;
}

export function RecentImpactLogs() {
  const { data, isLoading } = useTrackerControllerGetShipments(
    { status: 'DISPATCHED' },
    {
      query: { refetchInterval: 30000 },
    },
  );

  const allShipments = (data ?? []) as TrackerShipment[];

  const recentLogs = allShipments.slice(0, 3).map((shipment) => ({
    id: shipment.id,
    destination: shipment.destination,
    supplyType: shipment.class,
    quantity: shipment.shipmentId,
    status: shipment.verificationStatus.toLowerCase(),
  }));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-wider text-sm">
          Recent Impact Logs
        </h3>
        <button className="text-[10px] font-bold text-primary tracking-widest uppercase hover:underline">
          Download Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Supply Type</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-5 font-bold">{log.destination}</td>
                <td className="px-6 py-5 text-slate-600 dark:text-slate-400">
                  {log.supplyType}
                </td>
                <td className="px-6 py-5 font-bold text-primary">
                  {log.quantity}
                </td>
                <td className="px-6 py-5">
                  {log.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-xs">
                        check_circle
                      </span>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-xs">
                        schedule
                      </span>
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
