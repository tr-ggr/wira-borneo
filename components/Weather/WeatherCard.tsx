"use client";

import React from "react";

interface WeatherCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  accent?: string;
  className?: string;
}

export default function WeatherCard({
  label,
  value,
  unit,
  icon,
  accent = "var(--asean-yellow)",
  className = "",
}: WeatherCardProps) {
  return (
    <div
      className={`glass-sm p-4 flex flex-col gap-1.5 animate-fade-in ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-bold leading-none"
          style={{ color: accent }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[var(--text-muted)] font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
}
