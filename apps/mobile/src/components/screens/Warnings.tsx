'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronRight, Map } from 'lucide-react';
import { useAuthControllerGetSession, useWarningsControllerMe, useEvacuationControllerNearest } from '@wira-borneo/api-client';
import type { EvacuationSite } from '../MapComponent';

const FALLBACK_COORDS = { latitude: 1.5533, longitude: 110.3592 };

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function severityToClasses(severity: string): { bg: string; bgMuted: string; text: string; border: string } {
  const s = (severity ?? '').toLowerCase();
  if (s === 'critical') return { bg: 'bg-status-critical', bgMuted: 'bg-status-critical/10', text: 'text-status-critical', border: 'border-status-critical/20' };
  if (s === 'high' || s === 'medium') return { bg: 'bg-status-warning', bgMuted: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/20' };
  return { bg: 'bg-status-safe', bgMuted: 'bg-status-safe/10', text: 'text-status-safe', border: 'border-status-safe/20' };
}

export default function Warnings({ onViewSafeRoute }: { onViewSafeRoute?: (evac: EvacuationSite) => void }) {
  const { data: session } = useAuthControllerGetSession();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
    );
  }, []);

  const { data: warningsRaw } = useWarningsControllerMe({ query: { enabled: !!session?.user } });
  const warningsList = Array.isArray(warningsRaw) ? warningsRaw : [];
  type WarningRow = {
    id: string;
    title: string;
    message: string;
    hazardType: string;
    severity: string;
    startsAt: string;
    targetAreas?: { areaName: string }[];
  };
  const warnings = warningsList.map((w: WarningRow) => ({
    id: w.id,
    type: w.hazardType ?? 'Alert',
    title: w.title ?? 'Warning',
    description: w.message ?? '',
    time: formatTime(w.startsAt ?? new Date()),
    location: w.targetAreas?.[0]?.areaName ?? 'Area',
    classes: severityToClasses(w.severity ?? ''),
  }));

  const coords = userLocation ?? FALLBACK_COORDS;
  const hasWarnings = warnings.length > 0;
  const { data: nearestRaw } = useEvacuationControllerNearest(
    { latitude: coords.latitude, longitude: coords.longitude, limit: 3 },
    { query: { enabled: true } },
  );
  const nearestList = Array.isArray(nearestRaw) ? nearestRaw : [];
  type NearestRow = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string | null;
    capacity?: string | null;
    population?: string | null;
    source?: string | null;
    durationSeconds?: number;
    distanceMeters?: number;
  };
  const nearestWithEta: { evac: EvacuationSite; durationSeconds?: number }[] = nearestList.map((n: NearestRow) => {
    const evac: EvacuationSite = {
      id: n.id,
      name: n.name,
      latitude: n.latitude,
      longitude: n.longitude,
      type: n.type ?? null,
      capacity: n.capacity ?? null,
      population: n.population ?? null,
      source: n.source ?? null,
    };
    return { evac, durationSeconds: n.durationSeconds };
  });

  const handleViewSafeRoute = (evac: EvacuationSite) => {
    onViewSafeRoute?.(evac);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold wira-card-title">Current Warnings</h1>
        <span className="bg-status-critical/10 text-status-critical text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-status-critical/20">
          {warnings.length} Active
        </span>
      </header>

      <div className="space-y-4">
        {warnings.map((warning) => (
          <div key={warning.id} className="wira-card relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${warning.classes.bg}`}></div>

            <div className="flex gap-4">
              <div className={`shrink-0 h-10 w-10 rounded-xl ${warning.classes.bgMuted} flex items-center justify-center`}>
                <AlertCircle className={`${warning.classes.text} w-5 h-5`} />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono ${warning.classes.text} uppercase tracking-tighter`}>
                    {warning.type}
                  </span>
                  <span className="text-[10px] font-body text-wira-earth/50 italic">{warning.time}</span>
                </div>
                <h2 className="text-base font-display font-bold wira-card-title">{warning.title}</h2>
                <p className="text-xs font-body wira-card-body line-clamp-2">{warning.description}</p>
                <div className="pt-3 flex items-center justify-between border-t border-wira-ivory-dark/50 mt-2">
                  <div className="flex items-center gap-1.5 text-wira-teal">
                    <Map size={12} />
                    <span className="text-[10px] font-body font-semibold uppercase">{warning.location}</span>
                  </div>
                  <ChevronRight size={14} className="text-wira-gold" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="wira-card bg-wira-teal text-white border-none p-6 space-y-4">
        <h3 className="text-lg font-display font-bold">Automated Evacuation Route</h3>
        <p className="text-xs font-body text-white/80 leading-relaxed">
          {hasWarnings
            ? 'WIRA has identified the safest path to the nearest evacuation center based on active alerts.'
            : 'When warnings are active, WIRA will show the safest path to the nearest evacuation center.'}
        </p>
        {nearestWithEta.length > 0 ? (
          <ul className="space-y-2">
            {nearestWithEta.map(({ evac, durationSeconds }, idx) => (
              <li key={evac.id} className="flex items-center justify-between gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-sm font-body truncate">
                  Route {idx + 1}: {evac.name}
                  {durationSeconds != null && (
                    <span className="text-white/80 ml-1">— ~{Math.round(durationSeconds / 60)} min</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleViewSafeRoute(evac)}
                  className="shrink-0 bg-white text-wira-teal text-xs font-bold py-1.5 px-2.5 rounded-lg uppercase tracking-wider transition-transform active:scale-95"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-body text-white/70">Loading nearest evacuation sites…</p>
        )}
        <button
          type="button"
          onClick={() => nearestWithEta[0]?.evac && handleViewSafeRoute(nearestWithEta[0].evac)}
          disabled={nearestWithEta.length === 0}
          className="w-full bg-white text-wira-teal py-3 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          View Safe Route
        </button>
      </div>
      {!session?.user && (
        <p className="text-[11px] font-body text-wira-earth/50 text-center">Sign in to see personalized warnings.</p>
      )}
    </div>
  );
}
