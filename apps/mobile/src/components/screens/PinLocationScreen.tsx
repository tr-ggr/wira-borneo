'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Locate } from 'lucide-react';
import FormLocationPickerMap from '../FormLocationPickerMap';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { useI18n } from '../../i18n/context';

const DEFAULT_FALLBACK = { latitude: 1.5533, longitude: 110.3592 };

interface PinLocationScreenProps {
  initialLocation: { latitude: number; longitude: number } | null;
  onConfirm: (loc: { latitude: number; longitude: number }) => void;
  onBack: () => void;
}

export default function PinLocationScreen({
  initialLocation,
  onConfirm,
  onBack,
}: PinLocationScreenProps) {
  const { t } = useI18n();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(() => initialLocation ?? DEFAULT_FALLBACK);

  useEffect(() => {
    if (initialLocation) return;
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, [initialLocation]);

  const { placeName, isLoading } = useReverseGeocode(selectedLocation);

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-wira-ivory wira-batik-bg">
      <header className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-wira-earth/10 bg-white/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-wira-earth font-body text-sm font-medium hover:text-wira-teal transition-colors min-h-[44px] -ml-1"
          aria-label={t('map.backToMap')}
        >
          <ChevronLeft size={20} className="text-wira-teal" />
          {t('map.backToMap')}
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col">
        <p className="sr-only">{t('map.dragMapToPin')}</p>
        <div className="flex-1 min-h-[200px] rounded-none overflow-hidden border-0">
          <FormLocationPickerMap
            center={selectedLocation}
            onLocationChange={setSelectedLocation}
            fallback={DEFAULT_FALLBACK}
          />
        </div>

        <div className="shrink-0 p-4 bg-white border-t border-wira-earth/10 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="wira-card p-4 bg-wira-ivory-dark/30 border border-wira-earth/10 rounded-xl space-y-4">
            <div>
              <p className="form-label text-[11px] tracking-wider uppercase text-wira-earth/70 mb-1">
                {t('map.currentAddress')}
              </p>
              <p className="font-body text-sm text-wira-earth">
                {isLoading ? 'Loading…' : placeName || 'Unknown location'}
              </p>
              <p className="form-hint font-mono text-xs mt-1 text-wira-earth/60">
                {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-wira-teal/30 text-wira-teal font-body text-sm font-medium hover:bg-wira-teal/10 transition-colors min-h-[44px]"
              >
                <Locate size={18} aria-hidden />
                {t('map.useMyLocation')}
              </button>
              <button
                type="button"
                onClick={() => onConfirm(selectedLocation)}
                className="wira-btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 font-display font-bold uppercase tracking-widest shadow-lg shadow-wira-teal/20 min-h-[48px]"
              >
                <MapPin size={18} aria-hidden />
                {t('map.confirmPinLocation')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
