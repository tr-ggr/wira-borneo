"use client";

import { WeatherCode } from "@/lib/weather/types";

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

/**
 * Maps WMO weather code → a descriptive label + emoji icon.
 */
export function getWeatherInfo(code: number, isDay = true): { label: string; icon: string; color: string } {
  switch (code) {
    case WeatherCode.ClearSky:
      return { label: "Clear Sky", icon: isDay ? "☀️" : "🌙", color: "#F5D312" };
    case WeatherCode.MainlyClear:
      return { label: "Mainly Clear", icon: isDay ? "🌤️" : "🌙", color: "#F5D312" };
    case WeatherCode.PartlyCloudy:
      return { label: "Partly Cloudy", icon: "⛅", color: "#94b0d6" };
    case WeatherCode.Overcast:
      return { label: "Overcast", icon: "☁️", color: "#5a7ba8" };
    case WeatherCode.Fog:
    case WeatherCode.DepositingRimeFog:
      return { label: "Foggy", icon: "🌫️", color: "#5a7ba8" };
    case WeatherCode.LightDrizzle:
    case WeatherCode.ModerateDrizzle:
    case WeatherCode.DenseDrizzle:
      return { label: "Drizzle", icon: "🌦️", color: "#60a5fa" };
    case WeatherCode.LightFreezingDrizzle:
    case WeatherCode.DenseFreezingDrizzle:
      return { label: "Freezing Drizzle", icon: "🌨️", color: "#93c5fd" };
    case WeatherCode.SlightRain:
    case WeatherCode.ModerateRain:
      return { label: "Rain", icon: "🌧️", color: "#3b82f6" };
    case WeatherCode.HeavyRain:
      return { label: "Heavy Rain", icon: "🌧️", color: "#2563eb" };
    case WeatherCode.LightFreezingRain:
    case WeatherCode.HeavyFreezingRain:
      return { label: "Freezing Rain", icon: "🌨️", color: "#93c5fd" };
    case WeatherCode.SlightSnowfall:
    case WeatherCode.ModerateSnowfall:
    case WeatherCode.HeavySnowfall:
    case WeatherCode.SnowGrains:
      return { label: "Snow", icon: "❄️", color: "#e0f2fe" };
    case WeatherCode.SlightRainShowers:
    case WeatherCode.ModerateRainShowers:
      return { label: "Rain Showers", icon: "🌦️", color: "#3b82f6" };
    case WeatherCode.ViolentRainShowers:
      return { label: "Violent Showers", icon: "⛈️", color: "#1d4ed8" };
    case WeatherCode.SlightSnowShowers:
    case WeatherCode.HeavySnowShowers:
      return { label: "Snow Showers", icon: "🌨️", color: "#bfdbfe" };
    case WeatherCode.SlightOrModerateThunderstorm:
      return { label: "Thunderstorm", icon: "⛈️", color: "#CE1126" };
    case WeatherCode.ThunderstormWithSlightHail:
    case WeatherCode.ThunderstormWithHeavyHail:
      return { label: "Thunderstorm + Hail", icon: "⛈️", color: "#CE1126" };
    default:
      return { label: "Unknown", icon: "🌡️", color: "#94b0d6" };
  }
}

export default function WeatherIcon({ code, isDay = true, size = 32, className = "" }: WeatherIconProps) {
  const { icon } = getWeatherInfo(code, isDay);
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: "inline-block" }}
      role="img"
      aria-label={getWeatherInfo(code, isDay).label}
    >
      {icon}
    </span>
  );
}
