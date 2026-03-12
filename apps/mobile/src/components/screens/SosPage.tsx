'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  Shield,
  Radio,
  MapPin,
  Loader2,
  Navigation,
  Plus,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  useHelpRequestsControllerMe,
  useHelpRequestsControllerCreateSos,
  useEvacuationControllerAreas,
} from '@wira-borneo/api-client';
import MapComponent from '../MapComponent';

const ACTIVE_STATUSES = ['OPEN', 'CLAIMED', 'IN_PROGRESS'];
const SOS_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type HelpRequestLike = {
  id: string;
  status?: string;
  latitude: number;
  longitude: number;
  description?: string;
  createdAt?: string | Date;
  sosExpiresAt?: string | Date | null;
};

function getExpiresAt(r: HelpRequestLike): number | null {
  if (r.sosExpiresAt) return new Date(r.sosExpiresAt).getTime();
  if (r.description === 'SOS' && r.createdAt) return new Date(r.createdAt).getTime() + SOS_DURATION_MS;
  return null;
}

function isExpired(r: HelpRequestLike): boolean {
  const expiresAt = getExpiresAt(r);
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt;
}

type SosPageProps = {
  onNavigateToMap?: () => void;
  onNavigateToRequest?: (id: string, loc: { latitude: number; longitude: number }) => void;
  onNavigate?: (path: string) => void;
};

export default function SosPage({ onNavigateToMap, onNavigateToRequest, onNavigate }: SosPageProps) {
  const [safeModeOn, setSafeModeOn] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: myRequests, refetch: refetchMe } = useHelpRequestsControllerMe();
  const { mutate: createSos, isPending: isSendingSos } = useHelpRequestsControllerCreateSos();
  const { data: areasData } = useEvacuationControllerAreas();

  const requests = Array.isArray(myRequests) ? myRequests : [];
  const areasList = Array.isArray(areasData) ? areasData : [];
  type AreaItem = { id: string; name: string; latitude: number; longitude: number; type?: string | null; capacity?: string | null; population?: string | null; source?: string | null };
  const evacuationSites = areasList.map((a: AreaItem) => ({
    id: a.id,
    name: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    type: a.type ?? null,
    capacity: a.capacity ?? null,
    population: a.population ?? null,
    source: a.source ?? null,
  }));
  const helpRequestsForMap = requests.map((r: { id: string; latitude: number; longitude: number; urgency?: string; hazardType?: string }) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    urgency: (r.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') ?? 'HIGH',
    hazardType: r.hazardType ?? 'SOS',
  }));

  const activeRequest = useMemo(() => {
    const candidate = requests.find((r: HelpRequestLike) =>
      ACTIVE_STATUSES.includes(r.status ?? ''),
    ) as HelpRequestLike | undefined;
    if (!candidate || isExpired(candidate)) return null;
    return candidate;
  }, [requests, now]);

  const isActive = !!activeRequest;

  const remainingMs = useMemo(() => {
    if (!activeRequest) return 0;
    const expiresAt = getExpiresAt(activeRequest);
    if (expiresAt == null) return SOS_DURATION_MS;
    return Math.max(0, expiresAt - now);
  }, [activeRequest, now]);

  const remainingRatio = SOS_DURATION_MS > 0 ? Math.min(1, remainingMs / SOS_DURATION_MS) : 0;

  useEffect(() => {
    if (!isActive || remainingMs <= 0) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, remainingMs]);

  useEffect(() => {
    if (isActive && remainingMs <= 0) {
      refetchMe();
    }
  }, [remainingMs, isActive, refetchMe]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
  }, []);

  const handleSendSos = () => {
    if (!location) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setLocation(loc);
            createSos(
              { data: loc },
              {
                onSuccess: () => {
                  refetchMe();
                  if (onNavigateToMap) onNavigateToMap();
                },
                onError: () => alert('Failed to send SOS. Please try again.'),
              },
            );
          },
          () => alert('Location is required. Please enable GPS.'),
          { enableHighAccuracy: true },
        );
      } else {
        alert('Location is required. Please enable GPS.');
      }
      return;
    }
    createSos(
      { data: location },
      {
        onSuccess: () => {
          refetchMe();
          if (onNavigateToMap) onNavigateToMap();
        },
        onError: () => alert('Failed to send SOS. Please try again.'),
      },
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-sagip-border/30 animate-fade-in pb-20">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4">
        {/* Status ring with optional red countdown timer */}
        <section className="flex flex-col items-center pt-2 pb-6">
          <div className="relative flex items-center justify-center size-64 shrink-0 aspect-square">
            {/* Red countdown ring (SVG) when active */}
            {isActive && (
              <svg
                className="absolute inset-0 size-64 -rotate-90"
                viewBox="0 0 256 256"
                aria-hidden
              >
                <circle
                  cx="128"
                  cy="128"
                  r="122"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-sagip-border"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="122"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="text-asean-red transition-[stroke-dashoffset] duration-1000 ease-linear"
                  style={{
                    strokeDasharray: 2 * Math.PI * 122,
                    strokeDashoffset: 2 * Math.PI * 122 * (1 - remainingRatio),
                  }}
                />
              </svg>
            )}
            {/* Inner white circle + content; when active slightly smaller so red ring is visible */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-full border-[12px] border-sagip-border p-6 bg-white ${
                isActive ? 'size-[232px] shadow-[0_0_30px_rgba(255,107,0,0.4)] ring-4 ring-amber-400/30' : 'size-64'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {isActive && (
                  <div className="flex items-center justify-center size-10 rounded-full bg-white border-2 border-asean-red/30 mb-1">
                    <AlertTriangle className="size-5 text-asean-red" aria-hidden />
                  </div>
                )}
                <span className="font-sagip font-bold text-sagip-heading text-3xl uppercase tracking-tight">
                  SOS
                </span>
                <span
                  className={`font-sagip font-bold text-sm uppercase tracking-wider ${
                    isActive ? 'text-status-safe' : 'text-sagip-muted'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          {!isActive && (
            <button
              type="button"
              onClick={handleSendSos}
              disabled={isSendingSos}
              className="mt-4 w-full max-w-xs py-4 rounded-xl bg-asean-red text-white font-sagip font-bold text-sm uppercase tracking-wider shadow-lg shadow-asean-red/30 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSendingSos ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send SOS'
              )}
            </button>
          )}
          {isActive && activeRequest && (
            <button
              type="button"
              onClick={() =>
                onNavigateToRequest?.(activeRequest.id, {
                  latitude: activeRequest.latitude,
                  longitude: activeRequest.longitude,
                })
              }
              className="mt-4 text-asean-blue font-sagip font-bold text-xs uppercase"
            >
              View on map
            </button>
          )}
        </section>

        {/* Signal strength card */}
        <section className="wira-card p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="size-5 text-sagip-muted" />
              <span className="font-sagip font-medium text-sm text-slate-600">Signal Strength</span>
            </div>
            <span className="font-sagip font-bold text-sm text-sagip-heading">98% Secure</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-status-safe transition-all"
              style={{ width: '98%' }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-sagip-muted">
            <Shield className="size-3" />
            <span>Real-time encrypted responder connection</span>
          </div>
        </section>

        {/* Map section */}
        <section className="rounded-xl overflow-hidden h-[256px] bg-[#e2e8f0] relative">
          <div className="absolute inset-0 z-0">
            <MapComponent
              fillContainer
              weatherLocation={location ?? { latitude: 1.5533, longitude: 110.3592 }}
              helpRequests={helpRequestsForMap}
              focusedHelpRequestId={activeRequest?.id ?? null}
              evacuationSites={evacuationSites}
            />
          </div>
          <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-sagip-border rounded-lg px-3 py-2 shadow-sm">
              <span className="size-2 rounded-full bg-asean-red" />
              <span className="font-sagip font-bold text-xs text-sagip-heading uppercase">
                My Location
              </span>
            </div>
            <div className="flex items-center gap-2 bg-status-safe/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm">
              <MapPin className="size-4 text-white" />
              <span className="font-sagip font-bold text-xs text-white uppercase">
                Safe center: 0.8 km
              </span>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
            <button
              type="button"
              onClick={onNavigateToMap}
              className="size-10 rounded-lg bg-white shadow flex items-center justify-center"
              aria-label="Center map"
            >
              <Navigation className="size-5 text-slate-600" />
            </button>
            <button
              type="button"
              className="size-10 rounded-lg bg-white shadow flex items-center justify-center font-sagip font-bold text-slate-600"
              aria-label="Zoom in"
            >
              <Plus className="size-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onNavigateToMap}
            className="absolute left-4 bottom-4 z-10 text-asean-blue font-sagip font-bold text-xs uppercase underline"
          >
            Open full map
          </button>
        </section>

        {/* Emergency contacts */}
        <section className="flex gap-3">
          <a
            href="tel:911"
            className="flex-1 wira-card flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-asean-blue/30 transition-colors"
          >
            <Phone className="size-6 text-asean-red mb-1" />
            <span className="font-sagip font-bold text-lg text-sagip-heading">911</span>
            <span className="font-sagip font-bold text-[10px] text-sagip-muted uppercase">
              Police
            </span>
          </a>
          <a
            href="tel:117"
            className="flex-1 wira-card flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-asean-blue/30 transition-colors"
          >
            <Shield className="size-6 text-asean-blue mb-1" />
            <span className="font-sagip font-bold text-lg text-sagip-heading">117</span>
            <span className="font-sagip font-bold text-[10px] text-sagip-muted uppercase">EMS</span>
          </a>
          <a
            href="tel:999"
            className="flex-1 wira-card flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-asean-blue/30 transition-colors"
          >
            <span className="text-lg mb-1" aria-hidden>🔥</span>
            <span className="font-sagip font-bold text-lg text-sagip-heading">999</span>
            <span className="font-sagip font-bold text-[10px] text-sagip-muted uppercase">Fire</span>
          </a>
        </section>

        {/* Safe Mode toggle */}
        <section className="flex items-center justify-between p-4 rounded-xl border border-status-safe/20 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center rounded bg-status-safe/10">
              <Shield className="size-5 text-status-safe" />
            </div>
            <div>
              <p className="font-sagip font-bold text-sm text-status-safe">Safe Mode Toggle</p>
              <p className="font-sagip text-xs text-sagip-muted">Inform contacts you are okay</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={safeModeOn}
            onClick={() => setSafeModeOn(!safeModeOn)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              safeModeOn ? 'bg-status-safe' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white border border-slate-200 shadow transition-all ${
                safeModeOn ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </section>

        {/* Link to Help Center */}
        {onNavigate && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/help')}
              className="flex items-center gap-2 text-asean-blue font-sagip font-bold text-xs uppercase"
            >
              <HelpCircle className="size-4" />
              Full Help Center
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
