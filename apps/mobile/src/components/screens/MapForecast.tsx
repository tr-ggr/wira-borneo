'use client';

import React from 'react';

import { 
  useRiskIntelligenceControllerGetForecast, 
  useRiskIntelligenceControllerGetVulnerableRegions,
  useHelpRequestsControllerListOpen,
  useVolunteersControllerGetStatus,
  useRoutingControllerGetRoute,
  useEvacuationControllerAreas,
} from '@wira-borneo/api-client';
import MapComponent, { type EvacuationSite } from '../MapComponent';
import { X, Navigation2, MapPin, Home } from 'lucide-react';

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
  onCancelRouting
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
}) {
  const [userLocation, setUserLocation] = React.useState<{ latitude: number, longitude: number } | null>(null);
  const [routeOrigin, setRouteOrigin] = React.useState<RouteOrigin>('current');

  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  const activeLoc = mapFocus || userLocation || { latitude: 1.5533, longitude: 110.3592 };

  useRiskIntelligenceControllerGetForecast({
    latitude: activeLoc.latitude,
    longitude: activeLoc.longitude
  });

  const { data: vulnerableRegions } = useRiskIntelligenceControllerGetVulnerableRegions();
  const { data: openRequests } = useHelpRequestsControllerListOpen();
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

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold wira-card-title leading-tight">Kuching, Sarawak</h1>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-status-safe"></span>
          <p className="text-xs font-body font-medium text-wira-earth/70 uppercase tracking-wider">Status: Secure</p>
        </div>
      </header>

      {/* Map Interactive Component */}
      <div className="relative">
        <MapComponent 
          weatherLocation={activeLoc} 
          vulnerableRegions={vulnerableRegions as any} 
          helpRequests={showAllPins ? (openRequests as any) : []}
          focusedHelpRequestId={focusedHelpRequestId}
          mapFocus={mapFocus}
          homeLocation={homeLocation}
          evacuationSites={evacuationSites}
          onEvacClick={(evac) => {
            setMapFocus({ latitude: evac.latitude, longitude: evac.longitude });
            setMapFocusLabel('Evacuation site');
            setMapFocusEvac(evac);
          }}
          routeGeometry={routeGeometry}
          routeEta={routeEta}
        />

        {mapFocus && (
          <div className="absolute top-4 left-4 right-4 animate-slide-down space-y-2">
            <div className="bg-white/90 backdrop-blur-md border border-wira-teal/20 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-wira-gold/10 flex items-center justify-center">
                  <Navigation2 size={20} className="text-wira-gold animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-wira-gold">
                    Navigating to {mapFocusLabel ?? 'destination'}
                    {mapFocusEvac?.type && ` · ${mapFocusEvac.type}`}
                  </p>
                  {(mapFocusEvac?.capacity ?? mapFocusEvac?.source) && (
                    <p className="text-[10px] font-body text-wira-earth/60 mt-0.5">
                      {[mapFocusEvac?.capacity && `Capacity ${mapFocusEvac.capacity}`, mapFocusEvac?.source].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs font-body text-wira-earth/60">
                    Route from {routeOrigin === 'home' ? 'home' : 'current location'}
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
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => setRouteOrigin('home')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-body font-bold transition-colors ${routeOrigin === 'home' ? 'bg-wira-teal text-white' : 'text-wira-earth/70 hover:bg-wira-teal/10'}`}
                >
                  <Home size={14} />
                  Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}


