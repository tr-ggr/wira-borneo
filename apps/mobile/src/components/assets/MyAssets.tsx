'use client';

import React from 'react';
import { 
  Car, 
  Truck, 
  Anchor, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package
} from 'lucide-react';
import { 
  useAssetsControllerListMyAssets,
  useAuthControllerGetSession
} from '@wira-borneo/api-client';

export function MyAssets() {
  const { data: session } = useAuthControllerGetSession();
  const { data: assets, isLoading, error } = useAssetsControllerListMyAssets(
    { userId: session?.user?.id ?? '' },
    {
      query: {
        enabled: !!session?.user?.id,
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-asean-blue/30 border-t-asean-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-status-critical/10 text-status-critical flex items-start gap-2 text-sm">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p>Failed to load assets: {(error as any)?.message || 'Unknown error'}</p>
      </div>
    );
  }

  const typedAssets = assets as any[] | undefined;
  
  if (!typedAssets || typedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-sagip-border/10 rounded-2xl border-2 border-dashed border-sagip-border/40">
        <Package size={40} className="text-sagip-muted/40 mb-3" />
        <p className="font-sagip text-sm text-sagip-muted">No assets registered yet.</p>
      </div>
    );
  }

  const pendingAssets = typedAssets.filter(a => a.status === 'PENDING');
  const activeAssets = typedAssets.filter(a => a.status === 'APPROVED');

  const getIcon = (description = '') => {
    if (description.includes('[VEHICLE]')) return Truck;
    if (description.includes('[MARITIME]')) return Anchor;
    if (description.includes('[EQUIPMENT]')) return Wrench;
    return Car;
  };

  const AssetCard = ({ asset }: { asset: any }) => {
    const Icon = getIcon(asset.description);
    const isPending = asset.status === 'PENDING';

    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-sagip-border/60 shadow-sm">
        <div className={`p-3 rounded-lg ${isPending ? 'bg-asean-yellow/10 text-asean-yellow' : 'bg-status-safe/10 text-status-safe'}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-sagip font-bold text-sm text-sagip-heading truncate">{asset.name}</h4>
          <p className="font-sagip text-[10px] text-sagip-muted truncate">
            {asset.description?.replace(/\[.*?\]\s*/, '') || 'No description'}
          </p>
        </div>
        <div className="shrink-0">
          {isPending ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-asean-yellow/10 text-asean-yellow">
              <Clock size={12} />
              <span className="text-[10px] font-sagip font-bold uppercase tracking-wider">PENDING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-status-safe/10 text-status-safe">
              <CheckCircle2 size={12} />
              <span className="text-[10px] font-sagip font-bold uppercase tracking-wider">ACTIVE</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {pendingAssets.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-sagip font-bold text-[10px] uppercase tracking-wider text-asean-yellow flex items-center gap-2">
            <Clock size={14} />
            Pending Approval ({pendingAssets.length})
          </h3>
          <div className="space-y-2">
            {pendingAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {activeAssets.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-sagip font-bold text-[10px] uppercase tracking-wider text-status-safe flex items-center gap-2">
            <CheckCircle2 size={14} />
            Active Assets ({activeAssets.length})
          </h3>
          <div className="space-y-2">
            {activeAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}
      
      {pendingAssets.length === 0 && activeAssets.length === 0 && typedAssets.length > 0 && (
        <div className="space-y-2">
          {typedAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
