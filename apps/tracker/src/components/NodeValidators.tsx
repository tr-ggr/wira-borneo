'use client';

import { useTrackerControllerGetValidators } from '@wira-borneo/api-client';

interface TrackerValidator {
  id: string;
  nodeId: string;
  latencyMs: number;
  uptimePercentage: number;
  status: string;
}

export function NodeValidators() {
  const { data, isLoading } = useTrackerControllerGetValidators({
    query: { refetchInterval: 30000 },
  });
  const validators = (data ?? []) as TrackerValidator[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">hub</span>
          Node Validators
        </h3>
        <span className="text-xs text-slate-500">
          {validators.length} Online
        </span>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading validators...</div>
      ) : (
        <div className="space-y-4">
          {validators.slice(0, 3).map((validator) => (
            <div
              key={validator.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-2 rounded-full ${getStatusColor(validator.status.toLowerCase())}`}
                ></div>
                <div>
                  <p className="text-xs font-bold">{validator.nodeId}</p>
                  <p className="text-[10px] text-slate-500">
                    Latency: {validator.latencyMs}ms
                  </p>
                </div>
              </div>
              <p className="text-xs font-mono">
                {validator.uptimePercentage.toFixed(1)}% Up
              </p>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-4 text-xs font-bold text-primary hover:underline">
        View All Network Nodes
      </button>
    </div>
  );
}
