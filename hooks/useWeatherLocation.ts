"use client";

import { useState, useCallback } from "react";
import { getWeatherForecast, getAirQuality } from "@/lib/weather/actions";
import type { OpenMeteoResponse, AirQualityResponse } from "@/lib/weather/types";

interface WeatherData {
  forecast: OpenMeteoResponse;
  aqi: AirQualityResponse | null;
  lat: number;
  lon: number;
}

interface UseWeatherLocationReturn {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  fetchWeather: (lat: number, lon: number) => Promise<void>;
}

export function useWeatherLocation(): UseWeatherLocationReturn {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      const [forecastResult, aqiResult] = await Promise.all([
        getWeatherForecast({
          latitude: lat,
          longitude: lon,
          daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "uv_index_max",
          ],
          hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation_probability",
            "cloud_cover",
            "wind_speed_10m",
          ],
          currentWeather: true,
          forecastDays: 7,
          timezone: "auto",
        }),
        getAirQuality({
          latitude: lat,
          longitude: lon,
          hourly: ["us_aqi", "pm2_5"],
          forecastDays: 1,
          timezone: "auto",
        }),
      ]);

      if (!forecastResult.ok) {
        setError(forecastResult.error);
        setLoading(false);
        return;
      }

      setData({
        forecast: forecastResult.data,
        aqi: aqiResult.ok ? aqiResult.data : null,
        lat,
        lon,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchWeather };
}
