'use client';

import React, { useRef } from 'react';

import {
  useRiskIntelligenceControllerGetForecast,
  useRiskIntelligenceControllerGetVulnerableRegions,
  useHelpRequestsControllerListOpen,
  usePinsControllerFindVisible,
  useVolunteersControllerGetStatus,
  useRoutingControllerGetRoute,
  useEvacuationControllerAreas,
  useEvacuationControllerRoute,
} from '@wira-borneo/api-client';
import MapComponent, { type EvacuationSite, type MapComponentHandle } from '../MapComponent';
import { X, Navigation2, MapPin, Home, Plus, Minus, Locate, Layers, CloudRain, Building2, Wind, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { useI18n } from '../../i18n/context';

function weatherCodeToKey(code: number): string {
  if (code === 0) return 'map.clear';
  if (code <= 3) return 'map.mainlyClear';
  if (code <= 48) return 'map.fog';
  if (code <= 67) return 'map.rain';
  if (code <= 77) return 'map.snow';
  if (code <= 82) return 'map.showers';
  if (code <= 86) return 'map.snowShowers';
  if (code === 95) return 'map.thunderstorm';
  return 'map.variable';
}

export type RouteOrigin = 'current' | 'home';

export default function MapForecast({
  focusedHelpRequestId,
  mapFocus,
  mapFocusLabel,
  mapFocusEvac,
  setMapFocus,
  setMapFocusLabel,
  setMapFocusEvac,
  showAllPins,
  onCancelRouting,
  pickLocationFor = null,
  onLocationPicked,
  onNavigateToFeature,
}: {
  focusedHelpRequestId: string | null;
  mapFocus: { latitude: number, longitude: number } | null;
  mapFocusLabel: string | null;
  mapFocusEvac: EvacuationSite | null;
  setMapFocus: (loc: { latitude: number; longitude: number } | null) => void;
  setMapFocusLabel: (label: string | null) => void;
  setMapFocusEvac: (evac: EvacuationSite | null) => void;
  showAllPins: boolean;
  onCancelRouting: () => void;
  pickLocationFor?: 'hazard' | 'help' | null;
  onLocationPicked?: (latitude: number, longitude: number) => void;
  onNavigateToFeature?: (path: string) => void;
}) {
  const { t } = useI18n();
  const mapRef = useRef<MapComponentHandle>(null);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{ latitude: number, longitude: number } | null>(null);
  const [routeOrigin, setRouteOrigin] = React.useState<RouteOrigin>('current');
  const [selectedLocationForWeather, setSelectedLocationForWeather] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [actionButtonsExpanded, setActionButtonsExpanded] = React.useState(false);

  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  const activeLoc = mapFocus || userLocation || { latitude: 1.5533, longitude: 110.3592 };

  // Base forecast for current/active location (background)
  useRiskIntelligenceControllerGetForecast({
    latitude: activeLoc.latitude,
    longitude: activeLoc.longitude,
  });

  // Forecast for user-selected point on the map (shown in panel), without reloading map
  const { data: clickedForecast, isLoading: isForecastLoading } = useRiskIntelligenceControllerGetForecast(
    selectedLocationForWeather ?? activeLoc,
    { query: { enabled: !!selectedLocationForWeather } },
  );

  const { data: vulnerableRegions } = useRiskIntelligenceControllerGetVulnerableRegions();
  const { data: openRequests } = useHelpRequestsControllerListOpen();
  const { data: hazardPins } = usePinsControllerFindVisible();
  const { data: volunteerStatus } = useVolunteersControllerGetStatus();
  const status = volunteerStatus as { profile?: { baseLatitude?: number; baseLongitude?: number } } | null | undefined;
  const profile = status?.profile;
  const homeLocation =
    profile?.baseLatitude != null && profile?.baseLongitude != null
      ? { latitude: profile.baseLatitude, longitude: profile.baseLongitude }
      : null;

  const routeFrom = routeOrigin === 'home' && homeLocation ? homeLocation : userLocation;
  const routeParams =
    mapFocus && routeFrom
      ? {
          fromLon: routeFrom.longitude,
          fromLat: routeFrom.latitude,
          toLon: mapFocus.longitude,
          toLat: mapFocus.latitude,
        }
      : null;

  const { data: routeResponse } = useRoutingControllerGetRoute(
    routeParams ?? { fromLon: 0, fromLat: 0, toLon: 0, toLat: 0 },
    { query: { enabled: !!routeParams } }
  );

  const routePayload = routeResponse as { route?: { geometry?: { coordinates?: [number, number][] }; durationSeconds?: number; distanceMeters?: number } } | null | undefined;
  const routeData = routePayload?.route;
  const routeGeometry = routeData?.geometry?.coordinates ?? null;
  const routeEta =
    routeData && routeData.durationSeconds != null && routeData.distanceMeters != null
      ? { durationSeconds: routeData.durationSeconds, distanceMeters: routeData.distanceMeters }
      : null;

  const hazardRouteParams =
    mapFocusEvac && routeFrom
      ? {
          latitude: routeFrom.latitude,
          longitude: routeFrom.longitude,
          evacuationAreaId: mapFocusEvac.id,
          rainfall_mm: 0,
        }
      : undefined;
  const { data: hazardRouteResponse } = useEvacuationControllerRoute(
    hazardRouteParams ?? { latitude: 0, longitude: 0, evacuationAreaId: '' },
    { query: { enabled: !!hazardRouteParams } },
  );
  const hazardRouteGeometry = (hazardRouteResponse as { geometry?: { coordinates?: [number, number][] } } | undefined)?.geometry?.coordinates ?? null;

  const { data: areasData } = useEvacuationControllerAreas();
  const areasList = Array.isArray(areasData) ? areasData : [];
  type AreaItem = { id: string; name: string; latitude: number; longitude: number; type?: string | null; capacity?: string | null; population?: string | null; source?: string | null };
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

  // Derive evac types for filters
  const evacTypes = Array.from(
    new Set(
      evacuationSites
        .map((e) => (e.type ?? '').trim())
        .filter((t) => t.length > 0),
    ),
  );

  const [evacTypeFilter, setEvacTypeFilter] = React.useState<string | 'ALL'>('ALL');
  const [showVulnerableRegions, setShowVulnerableRegions] = React.useState(true);
  const [showHazardPins, setShowHazardPins] = React.useState(true);

  const filteredEvacuationSites =
    evacTypeFilter === 'ALL'
      ? evacuationSites
      : evacuationSites.filter(
          (e) => (e.type ?? '').trim().toLowerCase() === evacTypeFilter.toLowerCase(),
        );

  const filteredVulnerableRegions = showVulnerableRegions ? (vulnerableRegions as any) : [];
  const filteredHazardPins =
    showHazardPins && Array.isArray(hazardPins) ? (hazardPins as any) : [];

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="relative flex-1 min-h-0 flex flex-col">
        {pickLocationFor && (
          <div className="absolute top-4 left-4 right-4 z-20 animate-slide-up">
            <div className="bg-wira-teal text-white rounded-2xl p-4 shadow-xl border border-wira-teal-dark">
              <p className="text-sm font-body font-semibold">{t('map.tapMapSetLocation')}</p>
              <p className="text-xs font-body opacity-90 mt-0.5">
                {pickLocationFor === 'hazard' ? t('map.whereHazard') : t('map.whereHelp')}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Layers panel */}
        {layersOpen && (
          <div className="absolute top-4 left-4 right-4 z-20 max-w-sm animate-slide-up bg-white/95 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-wira-teal">{t('map.layers')}</span>
              <button type="button" onClick={() => setLayersOpen(false)} className="p-1 rounded-full hover:bg-wira-earth/5 text-wira-earth/70" aria-label={t('map.ariaCloseLayers')}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-display uppercase tracking-widest text-wira-earth/60 w-full">{t('map.evacTypes')}</span>
              <button type="button" onClick={() => setEvacTypeFilter('ALL')} className={`px-2 py-1 rounded-full text-[10px] font-body ${evacTypeFilter === 'ALL' ? 'bg-wira-teal text-white' : 'bg-white text-wira-earth/70 border border-wira-ivory-dark'}`}>{t('map.all')}</button>
              {evacTypes.map((evacType) => (
                <button key={evacType} type="button" onClick={() => setEvacTypeFilter(evacType)} className={`px-2 py-1 rounded-full text-[10px] font-body ${evacTypeFilter === evacType ? 'bg-wira-teal text-white' : 'bg-white text-wira-earth/70 border border-wira-ivory-dark'}`}>{evacType}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-wira-teal/10 text-[10px] font-body text-wira-earth/70">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showVulnerableRegions} onChange={(e) => setShowVulnerableRegions(e.target.checked)} className="h-3 w-3 rounded border-wira-ivory-dark" />
                <span>{t('map.riskAreas')}</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showHazardPins} onChange={(e) => setShowHazardPins(e.target.checked)} className="h-3 w-3 rounded border-wira-ivory-dark" />
                <span>{t('map.hazardPins')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Map controls overlay (top right) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg p-1">
          <button type="button" onClick={() => mapRef.current?.zoomIn()} className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors" aria-label={t('map.ariaZoomIn')}>
            <Plus size={20} />
          </button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors" aria-label={t('map.ariaZoomOut')}>
            <Minus size={20} />
          </button>
          <button type="button" onClick={() => mapRef.current?.centerOnUser()} className="flex items-center justify-center size-11 rounded-lg hover:bg-wira-earth/5 text-wira-earth transition-colors" aria-label={t('map.ariaCenterOnMe')}>
            <Locate size={20} />
          </button>
        </div>

        {/* Layers toggle (top left when panel closed) */}
        {!layersOpen && (
          <button type="button" onClick={() => setLayersOpen(true)} className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-body text-sm font-medium hover:bg-wira-earth/5 transition-colors" aria-label={t('map.ariaOpenLayers')}>
            <Layers size={18} />
            <span>{t('map.layers')}</span>
          </button>
        )}

        {/* Collapsible FAB: Flood sim / Pin location / Vulnerability */}
        {onNavigateToFeature && (
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
            {actionButtonsExpanded && (
              <>
                <button
                  type="button"
                  aria-label="Close map actions"
                  onClick={() => setActionButtonsExpanded(false)}
                  className="fixed inset-0 z-0"
                />
                <div className="relative z-10 flex flex-col gap-2 animate-slide-up">
                  <button type="button" onClick={() => { onNavigateToFeature('/map/flood-simulation'); setActionButtonsExpanded(false); }} className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-sagip text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px]" title={t('map.titleFloodSim')}>
                    <CloudRain size={18} className="text-wira-teal" />
                    <span>{t('map.floodSim')}</span>
                  </button>
                  <button type="button" onClick={() => { onNavigateToFeature('/map/pin-location'); setActionButtonsExpanded(false); }} className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-sagip text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px]" title={t('map.titlePinLocation')}>
                    <MapPin size={18} className="text-wira-teal" />
                    <span>{t('map.pinLocation')}</span>
                  </button>
                  <button type="button" onClick={() => { onNavigateToFeature('/map/building-vulnerability'); setActionButtonsExpanded(false); }} className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-sagip text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px]" title={t('map.titleBuildingVuln')}>
                    <Building2 size={18} className="text-wira-teal" />
                    <span>{t('map.vulnerability')}</span>
                  </button>
                  <button type="button" onClick={() => { onNavigateToFeature('/map/health-outbreaks'); setActionButtonsExpanded(false); }} className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-sagip text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px]" title={t('map.titleHealthOutbreaks')}>
                    <Activity size={18} className="text-wira-teal" />
                    <span>{t('map.healthOutbreaks')}</span>
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setActionButtonsExpanded((prev) => !prev)}
              aria-expanded={actionButtonsExpanded}
              aria-label={actionButtonsExpanded ? 'Close map actions' : 'Open map actions'}
              className="flex items-center justify-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-wira-teal/20 shadow-lg px-3 py-2.5 text-wira-earth font-sagip text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px] min-w-[44px]"
            >
              {actionButtonsExpanded ? <ChevronDown size={20} className="text-wira-teal" /> : <ChevronUp size={20} className="text-wira-teal" />}
              <span className="sr-only">{actionButtonsExpanded ? 'Close' : 'Actions'}</span>
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 h-full rounded-none">
        <MapComponent
          ref={mapRef}
          fillContainer
          weatherLocation={activeLoc} 
          vulnerableRegions={filteredVulnerableRegions} 
          helpRequests={showAllPins ? (openRequests as any) : []}
          hazardPins={filteredHazardPins}
          focusedHelpRequestId={focusedHelpRequestId}
          mapFocus={mapFocus}
          homeLocation={homeLocation}
          evacuationSites={filteredEvacuationSites}
          onEvacClick={(evac) => {
            setMapFocus({ latitude: evac.latitude, longitude: evac.longitude });
            setMapFocusLabel(t('map.evacuationSite'));
            setMapFocusEvac(evac);
          }}
          routeGeometry={routeGeometry}
          hazardRouteGeometry={hazardRouteGeometry}
          routeEta={routeEta}
          selectedPoint={selectedLocationForWeather}
          onMapClick={
            pickLocationFor && onLocationPicked
              ? (lat, lon) => onLocationPicked(lat, lon)
              : (lat, lon) => setSelectedLocationForWeather({ latitude: lat, longitude: lon })
          }
        />
        </div>

        {/* Weather for clicked point — bottom, high z-index so never blocked */}
        {selectedLocationForWeather && !pickLocationFor && (
          <div className="absolute bottom-4 left-4 right-4 z-30 animate-slide-up">
            <div className="bg-white border border-wira-teal/30 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <p className="text-[10px] font-sagip font-bold uppercase tracking-widest text-wira-teal">
                  {t('map.weatherAtPoint')}
                </p>
                {isForecastLoading ? (
                  <>
                    <p className="text-sm font-sagip font-normal text-wira-earth/70">{t('map.loadingWeather')}</p>
                    <p className="text-[10px] font-sagip font-normal text-wira-earth/50">
                      {selectedLocationForWeather.latitude.toFixed(3)}, {selectedLocationForWeather.longitude.toFixed(3)}
                    </p>
                  </>
                ) : (
                  (() => {
                    const forecastPayload = clickedForecast as { forecast?: { current_weather?: { temperature?: number; weathercode?: number; windspeed?: number }; hourly?: { temperature_2m?: (number | null)[] } } } | null | undefined;
                    const cw = forecastPayload?.forecast?.current_weather;
                    const hourly = forecastPayload?.forecast?.hourly?.temperature_2m;
                    const temp =
                      cw?.temperature != null
                        ? Number(cw.temperature)
                        : Array.isArray(hourly) && hourly.length > 0 && hourly[0] != null
                          ? Number(hourly[0])
                          : null;
                    const weatherCode = cw?.weathercode != null ? Number(cw.weathercode) : null;
                    const windSpeed = cw?.windspeed != null ? Number(cw.windspeed) : null;
                    const conditionLabel =
                      weatherCode != null ? t(weatherCodeToKey(weatherCode)) : null;
                    return (
                      <>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {temp != null && (
                            <span className="text-xl font-sagip font-bold text-wira-earth">
                              {Math.round(temp)}°
                            </span>
                          )}
                          {conditionLabel != null && (
                            <span className="text-sm font-sagip font-medium text-wira-earth/80">
                              {conditionLabel}
                            </span>
                          )}
                          {windSpeed != null && (
                            <span className="flex items-center gap-1 text-sm font-sagip font-normal text-wira-earth/70">
                              <Wind size={14} className="text-wira-teal shrink-0" />
                              {Math.round(windSpeed)} km/h
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-sagip font-normal text-wira-earth/50">
                          {selectedLocationForWeather.latitude.toFixed(3)}, {selectedLocationForWeather.longitude.toFixed(3)}
                        </p>
                      </>
                    );
                  })()
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocationForWeather(null)}
                className="h-8 w-8 shrink-0 rounded-full bg-wira-earth/5 flex items-center justify-center text-wira-earth/50 hover:bg-wira-earth/10 hover:text-wira-earth transition-all"
                aria-label="Close weather panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {mapFocus && !pickLocationFor && (
          <div className="absolute top-4 left-4 right-4 animate-slide-down space-y-2">
            <div className="bg-white/90 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-wira-gold/10 flex items-center justify-center">
                  <Navigation2 size={20} className="text-wira-gold animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-wira-gold">
                    {t('map.navigatingTo')} {mapFocusLabel ?? t('map.destination')}
                    {mapFocusEvac?.type && ` · ${mapFocusEvac.type}`}
                  </p>
                  {(mapFocusEvac?.capacity ?? mapFocusEvac?.source) && (
                    <p className="text-[10px] font-body text-wira-earth/60 mt-0.5">
                      {[mapFocusEvac?.capacity && `Capacity ${mapFocusEvac.capacity}`, mapFocusEvac?.source].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs font-body text-wira-earth/60">
                    {routeOrigin === 'home' ? t('map.routeFromHome') : t('map.routeFromCurrent')}
                  </p>
                  {routeEta && (
                    <p className="text-xs font-body text-wira-teal font-medium mt-0.5">
                      ETA ~{Math.round(routeEta.durationSeconds / 60)} min · {(routeEta.distanceMeters / 1000).toFixed(1)} km
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={onCancelRouting}
                className="h-8 w-8 rounded-full bg-wira-earth/5 flex items-center justify-center text-wira-earth/40 hover:bg-status-critical/10 hover:text-status-critical transition-all"
              >
                <X size={16} />
              </button>
            </div>
            {homeLocation && (
              <div className="flex rounded-xl overflow-hidden border border-wira-teal/20 bg-white/90 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setRouteOrigin('current')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-body font-bold transition-colors ${routeOrigin === 'current' ? 'bg-wira-teal text-white' : 'text-wira-earth/70 hover:bg-wira-teal/10'}`}
                >
                  <MapPin size={14} />
                  {t('map.current')}
                </button>
                <button
                  type="button"
                  onClick={() => setRouteOrigin('home')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-body font-bold transition-colors ${routeOrigin === 'home' ? 'bg-wira-teal text-white' : 'text-wira-earth/70 hover:bg-wira-teal/10'}`}
                >
                  <Home size={14} />
                  {t('map.home')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}


