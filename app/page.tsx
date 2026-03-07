"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWeatherLocation } from "@/hooks/useWeatherLocation";
import SearchBar from "@/components/UI/SearchBar";
import LayerControls, { type MapLayer } from "@/components/UI/LayerControls";
import WeatherPanel from "@/components/Weather/WeatherPanel";
import { ASEAN_COUNTRIES } from "@/lib/asean";

// Dynamically import the map to avoid SSR issues with OpenLayers
const MapView = dynamic(() => import("@/components/Map/MapView"), { ssr: false });

export default function WiraDashboard() {
  const [selectedLat, setSelectedLat] = useState<number | undefined>(undefined);
  const [selectedLon, setSelectedLon] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);
  const [activeLayer, setActiveLayer] = useState<MapLayer>("default");
  const [panelOpen, setPanelOpen] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  const { data, loading, error, fetchWeather } = useWeatherLocation();

  const handleLocationSelect = useCallback(
    async (lat: number, lon: number, name?: string) => {
      setSelectedLat(lat);
      setSelectedLon(lon);
      if (name) setLocationName(name);
      setPanelOpen(true);
      await fetchWeather(lat, lon);
    },
    [fetchWeather],
  );

  const handleSearchSelect = useCallback(
    (lat: number, lon: number, name: string) => {
      handleLocationSelect(lat, lon, name);
    },
    [handleLocationSelect],
  );

  const handleClosePanel = () => setPanelOpen(false);

  // Keyboard shortcut: Escape closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Full-screen map ── */}
      <div className="absolute inset-0">
        <MapView
          onLocationSelect={handleLocationSelect}
          selectedLat={selectedLat}
          selectedLon={selectedLon}
        />
      </div>

      {/* ── Top header bar ── */}
      <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 pointer-events-auto"
          style={{
            background: "linear-gradient(180deg, rgba(6,16,31,0.95) 0%, rgba(6,16,31,0.6) 60%, transparent 100%)",
          }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* ASEAN-inspired logo mark */}
            <div
              className="relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--asean-blue) 0%, var(--asean-blue-3) 100%)",
                border: "1.5px solid rgba(245,211,18,0.5)",
                boxShadow: "0 0 16px rgba(0,56,147,0.6)",
              }}
            >
              {/* Stylised compass/star icon referencing ASEAN emblem */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="3" fill="#F5D312" />
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
                  <line
                    key={i}
                    x1="12" y1="12"
                    x2={12 + 8 * Math.cos((deg - 90) * Math.PI / 180)}
                    y2={12 + 8 * Math.sin((deg - 90) * Math.PI / 180)}
                    stroke="#F5D312"
                    strokeWidth={i % 3 === 0 ? "1.8" : "0.8"}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none gradient-text">WIRA</h1>
              <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-widest uppercase leading-none mt-0.5">
                ASEAN Weather
              </p>
            </div>
          </div>

          {/* Centre: Search */}
          <div className="flex-1 max-w-xs">
            <SearchBar onLocationSelect={handleSearchSelect} />
          </div>

          {/* Right: Layer controls + Country picker toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LayerControls active={activeLayer} onChange={setActiveLayer} />
            <button
              onClick={() => setShowCountries((v) => !v)}
              className="h-10 px-3 rounded-xl glass-sm text-xs font-semibold
                text-[var(--text-secondary)] hover:text-[var(--asean-yellow)]
                border border-[rgba(0,56,147,0.4)] hover:border-[rgba(245,211,18,0.4)]
                transition-all flex items-center gap-1.5"
              aria-expanded={showCountries}
            >
              <span>🌏</span>
              <span className="hidden md:inline">Countries</span>
            </button>
          </div>
        </div>

        {/* ASEAN Country chips */}
        {showCountries && (
          <div
            className="mx-4 mb-3 p-3 rounded-xl animate-fade-in pointer-events-auto"
            style={{
              background: "rgba(6,16,31,0.92)",
              border: "1px solid rgba(0,56,147,0.4)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--asean-yellow)] opacity-70 mb-2">
              Jump to ASEAN Capital
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ASEAN_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    handleLocationSelect(c.lat, c.lon, `${c.capital}, ${c.name}`);
                    setShowCountries(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                    border border-[rgba(0,56,147,0.4)] text-[var(--text-secondary)]
                    hover:border-[rgba(245,211,18,0.5)] hover:text-[var(--asean-yellow)]
                    hover:bg-[rgba(0,56,147,0.25)] transition-all"
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Coordinate indicator (bottom-left) ── */}
      {selectedLat !== undefined && selectedLon !== undefined && (
        <div
          className="absolute bottom-14 left-4 z-20 px-3 py-1.5 rounded-lg text-[11px] font-mono
            text-[var(--text-muted)] glass-sm animate-fade-in"
        >
          {selectedLat.toFixed(4)}°, {selectedLon.toFixed(4)}°
        </div>
      )}

      {/* ── Loading indicator ── */}
      {loading && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40
          flex items-center gap-2 px-4 py-2 rounded-xl glass animate-fade-in"
        >
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--asean-yellow)] border-t-transparent animate-spin block" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">Fetching weather…</span>
        </div>
      )}

      {/* ── Error toast ── */}
      {error && !loading && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40
          flex items-center gap-2 px-4 py-2 rounded-xl animate-fade-in"
          style={{ background: "rgba(206,17,38,0.15)", border: "1px solid rgba(206,17,38,0.4)" }}
        >
          <span className="text-[var(--asean-red)]">⚠️</span>
          <span className="text-xs text-[var(--asean-red)] font-medium">{error}</span>
        </div>
      )}

      {/* ── Weather side panel ── */}
      {panelOpen && (
        <aside
          className="absolute top-2 right-2 bottom-2 z-30 w-[min(360px,calc(100%-1rem))] overflow-hidden rounded-2xl"
          style={{
            background: "rgba(6,16,31,0.92)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(0,56,147,0.35)",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Loading skeleton while waiting */}
          {loading && !data && (
            <div className="p-6 space-y-5 animate-fade-in">
              <div className="skeleton h-6 w-3/4 rounded-lg" />
              <div className="skeleton h-4 w-1/2 rounded-lg" />
              <div className="skeleton h-28 w-full rounded-xl mt-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
              <div className="space-y-2.5 mt-2">
                {[...Array(7)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
              </div>
            </div>
          )}

          {data && !loading && (
            <WeatherPanel
              forecast={data.forecast}
              aqi={data.aqi}
              lat={data.lat}
              lon={data.lon}
              locationName={locationName}
              onClose={handleClosePanel}
            />
          )}
        </aside>
      )}

      {/* ── Click-to-explore hint (initial state) ── */}
      {!panelOpen && !loading && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20
            flex items-center gap-2 px-4 py-2.5 rounded-full glass pointer-events-none animate-fade-in"
        >
          <span className="text-[var(--asean-yellow)]">👆</span>
          <span className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
            Click anywhere on the map to explore weather
          </span>
        </div>
      )}

      {/* ── ASEAN member count badge ── */}
      <div
        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full text-[10px]
          font-semibold glass-sm text-[var(--text-muted)] flex items-center gap-1.5"
      >
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: "var(--asean-yellow)" }}
        />
        11 ASEAN Member States
      </div>
    </div>
  );
}
