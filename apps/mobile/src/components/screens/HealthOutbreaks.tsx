'use client';

import React, { useRef, useEffect, useState } from 'react';
import MapComponent, {
  type MapComponentHandle,
  type RegionRiskChoroplethGeoJSON,
} from '../MapComponent';
import { Plus, Minus, Locate } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { getApiClientBaseUrl } from '@wira-borneo/api-client';

const DENGUE_REGIONS_PATH = '/api/health-outbreak/dengue/regions';

function getDengueRegionsUrl(): string {
  const base = getApiClientBaseUrl()?.trim() || 'http://localhost:3333';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}${DENGUE_REGIONS_PATH}`;
}

export default function HealthOutbreaks({
  onNavigateToMap,
}: {
  onNavigateToMap: () => void;
}) {
  const { t } = useI18n();
  const mapRef = useRef<MapComponentHandle>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [choropleth, setChoropleth] = useState<RegionRiskChoroplethGeoJSON | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(getDengueRegionsUrl())
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data?.type === 'FeatureCollection' && Array.isArray(data?.features)) {
          setChoropleth(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message ?? 'Failed to load dengue risk data');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const centerLoc =
    userLocation ?? { latitude: 12.8797, longitude: 121.774 };

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg p-1">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors"
            aria-label={t('map.ariaZoomIn')}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors"
            aria-label={t('map.ariaZoomOut')}
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.centerOnUser()}
            className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors"
            aria-label={t('map.ariaCenterOnMe')}
          >
            <Locate size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 rounded-none">
          <MapComponent
            ref={mapRef}
            fillContainer
            weatherLocation={centerLoc}
            vulnerableRegions={[]}
            helpRequests={[]}
            hazardPins={[]}
            evacuationSites={[]}
            regionRiskChoropleth={choropleth}
          />
        </div>

        {loadError && (
          <div className="absolute top-4 left-4 right-4 z-20 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm">
            {loadError}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-10 animate-slide-up space-y-2">
          <div className="bg-white/95 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-wira-teal">
                {t('map.titleHealthOutbreaks')}
              </span>
              <button
                type="button"
                onClick={onNavigateToMap}
                className="text-xs font-body text-wira-teal hover:underline"
              >
                Back to Map
              </button>
            </div>
            <p className="text-[10px] font-body text-wira-earth/80 mb-2">
              {t('map.dengueRiskLegend')}
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-body text-wira-earth/70">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                Low
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-body text-wira-earth/70">
                <span className="w-3 h-3 rounded-full bg-[#eab308]" />
                Medium
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-body text-wira-earth/70">
                <span className="w-3 h-3 rounded-full bg-[#dc2626]" />
                High
              </span>
            </div>
            <p className="text-[10px] font-body text-wira-earth/60 italic">
              {t('map.dengueRiskNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
