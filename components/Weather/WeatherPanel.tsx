"use client";

import { useMemo } from "react";
import type { OpenMeteoResponse, AirQualityResponse } from "@/lib/weather/types";
import WeatherCard from "./WeatherCard";
import WeatherIcon, { getWeatherInfo } from "./WeatherIcon";
import { ASEAN_COUNTRIES } from "@/lib/asean";

interface WeatherPanelProps {
  forecast: OpenMeteoResponse;
  aqi: AirQualityResponse | null;
  lat: number;
  lon: number;
  locationName?: string;
  onClose?: () => void;
}

function getAQILabel(aqi: number): { label: string; color: string } {
  if (aqi <= 50)  return { label: "Good",        color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate",     color: "#eab308" };
  if (aqi <= 150) return { label: "Unhealthy*",   color: "#f97316" };
  if (aqi <= 200) return { label: "Unhealthy",    color: "#ef4444" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#a855f7" };
  return               { label: "Hazardous",     color: "#CE1126" };
}

function getWindDirection(deg: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function WeatherPanel({ forecast, aqi, lat, lon, locationName, onClose }: WeatherPanelProps) {
  const current = forecast.current_weather;
  const daily   = forecast.daily;

  // Find nearest ASEAN country for emoji
  const nearestCountry = useMemo(() => {
    if (!lat || !lon) return null;
    let best: (typeof ASEAN_COUNTRIES)[0] | null = null;
    let bestDist = Infinity;
    for (const c of ASEAN_COUNTRIES) {
      const d = Math.hypot(c.lat - lat, c.lon - lon);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  }, [lat, lon]);

  // Get current AQI value (first available hourly)
  const currentAQI = useMemo(() => {
    const vals = aqi?.hourly?.["us_aqi"] as (number | null)[] | undefined;
    return vals?.find((v) => v !== null) ?? null;
  }, [aqi]);

  // Current weather info
  const weatherCode  = current?.weathercode ?? 0;
  const isDay        = (current?.is_day ?? 1) === 1;
  const weatherInfo  = getWeatherInfo(weatherCode, isDay);
  const temperature  = current?.temperature ?? 0;
  const windSpeed    = current?.windspeed ?? 0;
  const windDir      = getWindDirection(current?.winddirection ?? 0);

  // Get today's daily data
  const humidity = useMemo(() => {
    const h = forecast.hourly?.["relative_humidity_2m"] as (number | null)[] | undefined;
    return h?.find((v) => v !== null) ?? null;
  }, [forecast]);

  const feelsLike = useMemo(() => {
    const f = forecast.hourly?.["apparent_temperature"] as (number | null)[] | undefined;
    return f?.find((v) => v !== null) ?? null;
  }, [forecast]);

  // 7-day forecast
  const forecastDays = useMemo(() => {
    if (!daily?.["time"]) return [];
    const times     = daily["time"]                     as string[];
    const codes     = daily["weather_code"]              as number[];
    const tempMaxes = daily["temperature_2m_max"]        as number[];
    const tempMins  = daily["temperature_2m_min"]        as number[];
    const precipP   = daily["precipitation_probability_max"] as number[];
    const uvMax     = daily["uv_index_max"]              as number[];

    return times.map((t, i) => ({
      date: new Date(t),
      code: codes[i],
      max: tempMaxes[i],
      min: tempMins[i],
      precip: precipP?.[i] ?? 0,
      uv: uvMax?.[i] ?? 0,
    }));
  }, [daily]);

  return (
    <div className="h-full flex flex-col overflow-hidden animate-slide-in">
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex-shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,56,147,0.25) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(0,56,147,0.3)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{nearestCountry?.emoji ?? "📍"}</span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--asean-yellow)] opacity-80">
                {nearestCountry?.name ?? "ASEAN"}
              </p>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate">
              {locationName ?? `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
              {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                text-[var(--text-muted)] hover:text-[var(--asean-yellow)]
                hover:bg-[rgba(245,211,18,0.1)] transition-all"
              aria-label="Close weather panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Current conditions hero */}
        <div className="glass p-4 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <WeatherIcon code={weatherCode} isDay={isDay} size={52} />
            <p className="text-[11px] text-[var(--text-muted)] text-center leading-tight max-w-[70px]">
              {weatherInfo.label}
            </p>
          </div>
          <div className="flex-1">
            <p
              className="text-5xl font-black leading-none"
              style={{ color: weatherInfo.color }}
            >
              {Math.round(temperature)}
              <span className="text-2xl text-[var(--text-muted)] font-medium">°C</span>
            </p>
            {feelsLike !== null && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Feels like{" "}
                <span className="text-[var(--text-secondary)]">{Math.round(feelsLike)}°C</span>
              </p>
            )}
          </div>
          {/* AQI badge */}
          {currentAQI !== null && (
            <div
              className="flex flex-col items-center px-3 py-2 rounded-xl border"
              style={{
                borderColor: getAQILabel(currentAQI).color,
                background: `${getAQILabel(currentAQI).color}18`,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">AQI</span>
              <span className="text-xl font-black" style={{ color: getAQILabel(currentAQI).color }}>
                {currentAQI}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: getAQILabel(currentAQI).color }}>
                {getAQILabel(currentAQI).label}
              </span>
            </div>
          )}
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <WeatherCard
            label="Wind"
            value={`${Math.round(windSpeed)} ${windDir}`}
            unit="km/h"
            icon="💨"
            accent="var(--text-primary)"
          />
          {humidity !== null && (
            <WeatherCard
              label="Humidity"
              value={Math.round(humidity)}
              unit="%"
              icon="💧"
              accent="#60a5fa"
            />
          )}
          {forecastDays[0] && (
            <>
              <WeatherCard
                label="UV Index"
                value={forecastDays[0].uv.toFixed(1)}
                icon="☀️"
                accent={
                  forecastDays[0].uv >= 8 ? "#CE1126"
                  : forecastDays[0].uv >= 6 ? "#f97316"
                  : "#F5D312"
                }
              />
              <WeatherCard
                label="Rain Chance"
                value={forecastDays[0].precip}
                unit="%"
                icon="🌧️"
                accent="#3b82f6"
              />
            </>
          )}
        </div>

        {/* 7-day forecast */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--asean-yellow)] opacity-70 mb-2 px-1">
            7-Day Forecast
          </p>
          <div className="space-y-1.5">
            {forecastDays.map((day, i) => {
              const info = getWeatherInfo(day.code, true);
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                    ${isToday
                      ? "bg-[rgba(0,56,147,0.3)] border border-[rgba(245,211,18,0.2)]"
                      : "hover:bg-[rgba(0,56,147,0.15)]"
                    }`}
                >
                  <span className="text-xs font-bold text-[var(--text-secondary)] w-8 flex-shrink-0">
                    {isToday ? "Today" : WEEKDAYS[day.date.getDay()]}
                  </span>
                  <span className="text-base flex-shrink-0" aria-label={info.label}>{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${day.precip}%`,
                          background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {Math.round(day.max)}°
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {Math.round(day.min)}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribution */}
        <p className="text-[10px] text-[var(--text-muted)] text-center py-2">
          Data from{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
            className="text-[var(--asean-yellow)] hover:underline">
            Open-Meteo
          </a>{" "}
          · Map{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
            className="text-[var(--asean-yellow)] hover:underline">
            OpenStreetMap
          </a>
        </p>
      </div>
    </div>
  );
}
