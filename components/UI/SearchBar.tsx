"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { geocodeLocation } from "@/lib/weather/actions";
import type { GeocodingResult } from "@/lib/weather/types";
import { ASEAN_COUNTRY_CODES, ASEAN_COUNTRIES } from "@/lib/asean";

interface SearchBarProps {
  onLocationSelect: (lat: number, lon: number, name: string) => void;
}

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        // Search across all ASEAN country codes
        const searchPromises = ASEAN_COUNTRY_CODES.map((cc) =>
          geocodeLocation({ name: query, count: 3, countryCode: cc }),
        );
        const all = await Promise.all(searchPromises);
        const merged: GeocodingResult[] = [];
        for (const r of all) {
          if (r.ok && r.data.results) merged.push(...r.data.results);
        }
        // Sort by population descending (fallback 0)
        merged.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
        setResults(merged.slice(0, 8));
        setOpen(merged.length > 0);
      });
    }, 350);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (r: GeocodingResult) => {
    const country = ASEAN_COUNTRIES.find((c) => c.code === r.country_code);
    const displayName = `${r.name}${country ? `, ${country.name}` : ""}`;
    onLocationSelect(r.latitude, r.longitude, displayName);
    setQuery(displayName);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        {/* Search icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--asean-yellow)] opacity-80 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ASEAN city…"
          className="w-full h-10 pl-9 pr-4 rounded-xl text-sm font-medium
            bg-[rgba(12,26,48,0.85)] border border-[rgba(0,56,147,0.4)]
            text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
            backdrop-blur-md focus:outline-none focus:border-[var(--asean-yellow)]
            focus:ring-1 focus:ring-[rgba(245,211,18,0.3)] transition-all"
        />

        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block w-3.5 h-3.5 rounded-full border-2 border-[var(--asean-yellow)] border-t-transparent animate-spin" />
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-50 overflow-hidden rounded-xl glass shadow-xl shadow-black/40">
          {results.map((r, i) => {
            const country = ASEAN_COUNTRIES.find((c) => c.code === r.country_code);
            return (
              <button
                key={`${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[rgba(0,56,147,0.3)] transition-colors group"
              >
                <span className="text-xl flex-shrink-0">{country?.emoji ?? "📍"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--asean-yellow)] transition-colors truncate">
                    {r.name}
                    {r.admin1 ? `, ${r.admin1}` : ""}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {country?.name ?? r.country}
                    {r.population ? ` · ${(r.population / 1000).toFixed(0)}k` : ""}
                  </p>
                </div>
                <span className="ml-auto text-[var(--asean-yellow)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
