'use client';

import {
  useEvacuationControllerAreas,
  useRiskIntelligenceControllerGetVulnerableRegions,
} from '@wira-borneo/api-client';
import { useI18n } from '../../i18n/context';
import MapComponent, { type EvacuationSite } from '../MapComponent';

type RegionalMeshMapProps = {
  onOpenMap?: () => void;
};

const DEFAULT_CENTER = { latitude: 1.5533, longitude: 110.3592 };

type AreaItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type?: string | null;
  capacity?: string | null;
  population?: string | null;
  source?: string | null;
};

export function RegionalMeshMap({ onOpenMap }: RegionalMeshMapProps) {
  const { t } = useI18n();
  const { data: areasData } = useEvacuationControllerAreas();
  const areasList = Array.isArray(areasData) ? areasData : [];
  const evacuationSites: EvacuationSite[] = areasList.map((a: AreaItem) => ({
    id: a.id,
    name: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    type: a.type ?? null,
    capacity: a.capacity ?? null,
    population: a.population ?? null,
    source: a.source ?? null,
  }));

  const { data: vulnerableRegionsData } =
    useRiskIntelligenceControllerGetVulnerableRegions();
  const vulnerableRegions = Array.isArray(vulnerableRegionsData)
    ? vulnerableRegionsData
    : [];

  return (
    <div className="border border-sagip-border rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden w-full flex-1 min-h-0 flex flex-col bg-transparent">
      <div className="bg-[#f1f5f9] border-b border-sagip-border flex items-center justify-between px-3 pt-3 pb-3">
        <h3 className="font-sagip font-bold text-sagip-heading text-xs tracking-[1.2px] uppercase leading-4">
          {t('home.regionalMap.title')}
        </h3>
        <div className="flex items-center gap-1">
          <span className="bg-[#22c55e] rounded-full size-2 shrink-0" aria-hidden />
          <span className="font-sagip font-normal text-[#64748b] text-[10px] leading-[15px]">
            {t('home.regionalMap.live')}
          </span>
        </div>
      </div>
      <div className="h-48 relative shrink-0 w-full overflow-hidden">
        <MapComponent
          fillContainer
          weatherLocation={DEFAULT_CENTER}
          vulnerableRegions={vulnerableRegions}
          helpRequests={[]}
          hazardPins={[]}
          evacuationSites={evacuationSites}
        />
        <button
          type="button"
          onClick={onOpenMap}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={t('home.regionalMap.ariaViewFullMap')}
        />
      </div>
    </div>
  );
}
