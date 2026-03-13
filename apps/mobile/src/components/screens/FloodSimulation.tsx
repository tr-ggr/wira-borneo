'use client';

import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useEvacuationControllerAreas,
  getEvacuationControllerHazardRouteQueryOptions,
  useHazardRiskLayerControllerGetRiskLayer,
} from '@wira-borneo/api-client';
import MapComponent, {
  type EvacuationSite,
  type HazardRiskPoint,
  type MapComponentHandle,
} from '../MapComponent';
import { X, Plus, Minus, Locate, Layers } from 'lucide-react';
import { useI18n } from '../../i18n/context';

const FLOOD_LEVEL_MIN_M = 0;
const FLOOD_LEVEL_MAX_M = 2;
const FLOOD_LEVEL_STEP_M = 0.1;
/** 1 m flood level ≈ 100 mm rainfall for API */
const FLOOD_M_TO_RAINFALL_MM = 100;

export default function FloodSimulation({
  onNavigateToMap,
}: {
  onNavigateToMap: () => void;
}) {
  const mapRef = useRef<MapComponentHandle>(null);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPoint, setSelectedPoint] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [floodLevelM, setFloodLevelM] = React.useState(1.2);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [showEvacuationCenters, setShowEvacuationCenters] =
    React.useState(true);
  const [evacTypeFilter, setEvacTypeFilter] = React.useState<string | 'ALL'>(
    'ALL',
  );

  React.useEffect(() => {
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

  const rainfallMm = Math.round(floodLevelM * FLOOD_M_TO_RAINFALL_MM);
  const [debouncedRainfallMm, setDebouncedRainfallMm] =
    React.useState(rainfallMm);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedRainfallMm(rainfallMm), 350);
    return () => clearTimeout(t);
  }, [rainfallMm]);

  const { data: riskLayerData } = useHazardRiskLayerControllerGetRiskLayer(
    { rainfall_mm: debouncedRainfallMm },
    { query: { enabled: true, staleTime: 45_000 } },
  );
  const hazardRiskPoints: HazardRiskPoint[] = Array.isArray(riskLayerData)
    ? (riskLayerData as HazardRiskPoint[])
    : [];

  const { data: areasData } = useEvacuationControllerAreas();
  const areasList = Array.isArray(areasData) ? areasData : [];
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

  const evacTypes = Array.from(
    new Set(
      evacuationSites
        .map((e) => (e.type ?? '').trim())
        .filter((t) => t.length > 0),
    ),
  );
  const filteredEvacuationSites = showEvacuationCenters
    ? evacTypeFilter === 'ALL'
      ? evacuationSites
      : evacuationSites.filter(
          (e) =>
            (e.type ?? '').trim().toLowerCase() ===
            evacTypeFilter.toLowerCase(),
        )
    : [];

  /** Fallback when no geolocation: center on hazard graph region (Mandaue City, Cebu) so route requests stay inside graph. */
  const routeFrom = userLocation;
  const hazardRouteParams =
    selectedPoint && routeFrom
      ? {
          fromLat: routeFrom.latitude,
          fromLon: routeFrom.longitude,
          toLat: selectedPoint.latitude,
          toLon: selectedPoint.longitude,
          rainfall_mm: debouncedRainfallMm,
        }
      : null;

  const hazardRouteQueryOptions =
    getEvacuationControllerHazardRouteQueryOptions(
      hazardRouteParams ?? {
        fromLat: 0,
        fromLon: 0,
        toLat: 0,
        toLon: 0,
        rainfall_mm: 0,
      },
      { query: { enabled: !!hazardRouteParams } },
    );
  const { data: hazardRouteResponse } = useQuery(hazardRouteQueryOptions);

  const responseBody =
    hazardRouteResponse != null &&
    typeof hazardRouteResponse === 'object' &&
    'data' in hazardRouteResponse
      ? (hazardRouteResponse as { data: unknown }).data
      : hazardRouteResponse;
  const hazardRoute = responseBody as
    | {
        geometry?: { coordinates?: [number, number][] | Array<number[]> };
        durationSeconds?: number;
        distanceMeters?: number;
      }
    | null
    | undefined;
  const rawCoordinates = hazardRoute?.geometry?.coordinates;
  const hazardRouteGeometry = ((): [number, number][] | null => {
    if (
      !rawCoordinates ||
      !Array.isArray(rawCoordinates) ||
      rawCoordinates.length < 2
    )
      return null;
    const arr = rawCoordinates as Array<[number, number] | number[]>;
    const out: [number, number][] = [];
    for (const c of arr) {
      if (!Array.isArray(c) || c.length < 2) continue;
      let a = Number(c[0]);
      let b = Number(c[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (a >= -90 && a <= 90 && (b > 90 || b < -90)) {
        [a, b] = [b, a];
      }
      out.push([a, b]);
    }
    return out.length >= 2 ? out : null;
  })();
  const routeEta =
    hazardRoute &&
    hazardRoute.durationSeconds != null &&
    hazardRoute.distanceMeters != null
      ? {
          durationSeconds: hazardRoute.durationSeconds,
          distanceMeters: hazardRoute.distanceMeters,
        }
      : null;

  const centerLoc = userLocation;

  const { t } = useI18n();

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Layers panel + map controls: same pattern as MapForecast */}
        {layersOpen ? (
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-row gap-3 items-start">
            <div className="flex-1 min-w-0 max-w-sm animate-slide-up bg-white border border-wira-earth/10 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-display font-bold uppercase tracking-widest text-wira-earth">
                  {t('map.mapLayers')}
                </span>
                <button
                  type="button"
                  onClick={() => setLayersOpen(false)}
                  className="p-1.5 rounded-full hover:bg-wira-earth/5 text-wira-earth/70"
                  aria-label={t('map.ariaCloseLayers')}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-display uppercase tracking-widest text-wira-earth/60">
                  {t('map.evacTypes')}
                </p>
                <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 min-w-0 [&::-webkit-scrollbar]:h-1">
                  <button
                    type="button"
                    onClick={() => setEvacTypeFilter('ALL')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body ${evacTypeFilter === 'ALL' ? 'bg-wira-teal text-white' : 'bg-white text-wira-earth border border-wira-earth/20 hover:border-wira-earth/30'}`}
                  >
                    {t('map.all')}
                  </button>
                  {evacTypes.map((evacType) => (
                    <button
                      key={evacType}
                      type="button"
                      onClick={() => setEvacTypeFilter(evacType)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body ${evacTypeFilter === evacType ? 'bg-wira-teal text-white' : 'bg-white text-wira-earth border border-wira-earth/20 hover:border-wira-earth/30'}`}
                    >
                      {evacType}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-0">
                <p className="text-[11px] font-display uppercase tracking-widest text-wira-earth/80">
                  {t('map.mapLayers')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-wira-earth">
                      {t('map.evacuationCenters')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showEvacuationCenters}
                      onClick={() =>
                        setShowEvacuationCenters(!showEvacuationCenters)
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-wira-teal/30 ${showEvacuationCenters ? 'bg-wira-teal' : 'bg-sagip-border'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left] ${showEvacuationCenters ? 'left-5' : 'left-0.5'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-wira-earth/10 space-y-2">
                <span className="text-sm font-display font-bold text-wira-earth">
                  {t('map.floodRisk')}
                </span>
                <div className="space-y-1.5 text-xs font-body text-wira-earth/80">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[var(--color-status-critical)]"
                      aria-hidden
                    />
                    <span>{t('map.highRiskEvacuate')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[var(--color-status-warning)]"
                      aria-hidden
                    />
                    <span>{t('map.moderateRisk')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[var(--color-status-safe)]"
                      aria-hidden
                    />
                    <span>{t('map.lowRisk')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-1 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg p-1">
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
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setLayersOpen(true)}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-body text-sm font-medium hover:bg-wira-earth/5 transition-colors"
              aria-label={t('map.ariaOpenLayers')}
            >
              <Layers size={18} />
              <span>{t('map.mapLayers')}</span>
            </button>
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
          </>
        )}

        <div className="flex-1 min-h-0 rounded-none">
          <MapComponent
            ref={mapRef}
            fillContainer
            weatherLocation={centerLoc}
            vulnerableRegions={[]}
            helpRequests={[]}
            hazardPins={[]}
            evacuationSites={filteredEvacuationSites}
            mapFocus={selectedPoint}
            hazardRouteGeometry={hazardRouteGeometry}
            hazardRouteOnly
            hazardRiskPoints={hazardRiskPoints}
            routeEta={routeEta}
            onMapClick={(lat, lon) =>
              setSelectedPoint({ latitude: lat, longitude: lon })
            }
          />
        </div>

        {/* Flood Resilience Scenario card */}
        <div className="absolute bottom-4 left-4 right-4 z-10 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-orange-500">
                Active module
              </span>
              <button
                type="button"
                onClick={onNavigateToMap}
                className="text-xs font-body text-wira-teal hover:underline"
              >
                Back to Map
              </button>
            </div>
            <p className="text-sm font-body font-bold text-wira-earth mb-3">
              Flood Resilience Scenario
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-body text-wira-earth/80 whitespace-nowrap">
                Flood level
              </span>
              <input
                type="range"
                min={FLOOD_LEVEL_MIN_M}
                max={FLOOD_LEVEL_MAX_M}
                step={FLOOD_LEVEL_STEP_M}
                value={floodLevelM}
                onChange={(e) => setFloodLevelM(parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-wira-teal/20 accent-wira-teal"
              />
              <span className="text-sm font-body font-semibold text-wira-teal min-w-[3ch]">
                {floodLevelM.toFixed(1)}m
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-body text-wira-earth/70">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Evacuation routes
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Stagnation zones
              </span>
            </div>
          </div>
        </div>

        {/* Destination & route ETA when a point is selected */}
        {selectedPoint && (
          <div className="absolute top-4 left-4 right-4 z-10 animate-slide-down">
            <div className="bg-white/90 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-wira-teal">
                  Destination
                </p>
                <p className="text-[10px] font-body text-wira-earth/60">
                  {selectedPoint.latitude.toFixed(4)},{' '}
                  {selectedPoint.longitude.toFixed(4)}
                </p>
                {routeEta && (
                  <p className="text-xs font-body text-wira-teal font-medium mt-0.5">
                    ETA ~{Math.round(routeEta.durationSeconds / 60)} min ·{' '}
                    {(routeEta.distanceMeters / 1000).toFixed(1)} km
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="h-8 w-8 rounded-full bg-wira-earth/5 flex items-center justify-center text-wira-earth/40 hover:bg-wira-earth/10 hover:text-wira-earth transition-all"
                aria-label="Clear destination"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
