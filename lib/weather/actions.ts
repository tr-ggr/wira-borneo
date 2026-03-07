"use server";

/**
 * Open-Meteo – Next.js Server Actions
 *
 * Each exported function is a typed, "use server" action that wraps the
 * corresponding Open-Meteo endpoint.  All network calls go through the
 * official Open-Meteo REST API and return an `ActionResult<T>` so callers
 * can handle errors without try/catch at the call site.
 *
 * @see https://open-meteo.com/en/docs
 */

import type {
  ActionResult,
  AirQualityOptions,
  AirQualityResponse,
  BoundingBox,
  ClimateProjectionOptions,
  ClimateProjectionResponse,
  ElevationResponse,
  FloodForecastOptions,
  FloodForecastResponse,
  GeocodingOptions,
  GeocodingResponse,
  GeocodingResult,
  MarineWeatherOptions,
  MarineWeatherResponse,
  OpenMeteoResponse,
  SeasonalForecastOptions,
  WeatherArchiveOptions,
  WeatherForecastOptions,
} from "./types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const BASE_URLS = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality",
  marine: "https://marine-api.open-meteo.com/v1/marine",
  flood: "https://flood-api.open-meteo.com/v1/flood",
  archive: "https://archive-api.open-meteo.com/v1/archive",
  climate: "https://climate-api.open-meteo.com/v1/climate",
  seasonal: "https://seasonal-forecast-api.open-meteo.com/v1/seasonal",
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  elevation: "https://api.open-meteo.com/v1/elevation",
  /** Nominatim (OpenStreetMap) — used only for bounding box enrichment. */
  nominatim: "https://nominatim.openstreetmap.org/search",
} as const;

/** Build a URLSearchParams object, filtering out undefined values. */
function buildParams(
  record: Record<string, string | number | boolean | string[] | number[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, (value as Array<string | number>).join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

/** Fetch a URL and return a typed JSON response, or an error. */
async function fetchJSON<T>(url: string): Promise<ActionResult<T>> {
  try {
    const response = await fetch(url, {
      // Next.js built-in cache — revalidate every 15 minutes by default.
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `Open-Meteo API error ${response.status}: ${text}`,
      };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Network error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// 1. Weather Forecast
// ---------------------------------------------------------------------------

/**
 * Fetch a weather forecast for a given location.
 *
 * @example
 * const result = await getWeatherForecast({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   daily: ["temperature_2m_max", "precipitation_sum"],
 *   forecastDays: 7,
 * });
 */
export async function getWeatherForecast(
  options: WeatherForecastOptions,
): Promise<ActionResult<OpenMeteoResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    hourly: options.hourly,
    daily: options.daily,
    forecast_days: options.forecastDays,
    past_days: options.pastDays,
    models: options.model,
    current_weather: options.currentWeather,
    timezone: options.timezone ?? "auto",
    temperature_unit: options.temperatureUnit,
    wind_speed_unit: options.windSpeedUnit,
    precipitation_unit: options.precipitationUnit,
  });

  return fetchJSON<OpenMeteoResponse>(`${BASE_URLS.forecast}?${params}`);
}

// ---------------------------------------------------------------------------
// 2. Air Quality
// ---------------------------------------------------------------------------

/**
 * Fetch air quality data including AQI, pollen, and pollutant concentrations.
 *
 * @example
 * const result = await getAirQuality({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   hourly: ["pm2_5", "us_aqi"],
 * });
 */
export async function getAirQuality(
  options: AirQualityOptions,
): Promise<ActionResult<AirQualityResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    hourly: options.hourly,
    forecast_days: options.forecastDays,
    past_days: options.pastDays,
    timezone: options.timezone ?? "auto",
  });

  return fetchJSON<AirQualityResponse>(`${BASE_URLS.airQuality}?${params}`);
}

// ---------------------------------------------------------------------------
// 3. Marine Weather
// ---------------------------------------------------------------------------

/**
 * Fetch marine weather data, including wave height, direction, and period.
 *
 * @example
 * const result = await getMarineWeather({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   daily: ["wave_height_max", "swell_wave_height_max"],
 * });
 */
export async function getMarineWeather(
  options: MarineWeatherOptions,
): Promise<ActionResult<MarineWeatherResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    hourly: options.hourly,
    daily: options.daily,
    forecast_days: options.forecastDays,
    past_days: options.pastDays,
    timezone: options.timezone ?? "auto",
  });

  return fetchJSON<MarineWeatherResponse>(`${BASE_URLS.marine}?${params}`);
}

// ---------------------------------------------------------------------------
// 4. River / Flood Forecast
// ---------------------------------------------------------------------------

/**
 * Fetch GloFAS river discharge and flood probability data.
 *
 * @example
 * const result = await getFloodForecast({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   daily: ["river_discharge", "river_discharge_max"],
 * });
 */
export async function getFloodForecast(
  options: FloodForecastOptions,
): Promise<ActionResult<FloodForecastResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    daily: options.daily,
    forecast_days: options.forecastDays,
    past_days: options.pastDays,
    ensemble: options.ensemble,
    timezone: options.timezone ?? "auto",
  });

  return fetchJSON<FloodForecastResponse>(`${BASE_URLS.flood}?${params}`);
}

// ---------------------------------------------------------------------------
// 5. Historical Archive (ERA5)
// ---------------------------------------------------------------------------

/**
 * Retrieve historical weather data from the ERA5 reanalysis dataset
 * (available from 1940 to approximately 5 days ago).
 *
 * @example
 * const result = await getWeatherArchive({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 *   daily: ["temperature_2m_max", "precipitation_sum"],
 * });
 */
export async function getWeatherArchive(
  options: WeatherArchiveOptions,
): Promise<ActionResult<OpenMeteoResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    start_date: options.startDate,
    end_date: options.endDate,
    hourly: options.hourly,
    daily: options.daily,
    timezone: options.timezone ?? "auto",
    temperature_unit: options.temperatureUnit,
  });

  return fetchJSON<OpenMeteoResponse>(`${BASE_URLS.archive}?${params}`);
}

// ---------------------------------------------------------------------------
// 6. Climate Projections (CMIP6)
// ---------------------------------------------------------------------------

/**
 * Fetch long-term climate projections using CMIP6 models for a date range.
 *
 * @example
 * const result = await getClimateProjection({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   startDate: "2050-01-01",
 *   endDate: "2050-12-31",
 *   models: [ClimateModel.MRI_AGCM3_2_S],
 *   daily: ["temperature_2m_max", "precipitation_sum"],
 * });
 */
export async function getClimateProjection(
  options: ClimateProjectionOptions,
): Promise<ActionResult<ClimateProjectionResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    start_date: options.startDate,
    end_date: options.endDate,
    models: options.models,
    daily: options.daily,
    temperature_unit: options.temperatureUnit,
    wind_speed_unit: options.windSpeedUnit,
    precipitation_unit: options.precipitationUnit,
    disable_bias_correction: options.disableBiasCorrection,
  });

  return fetchJSON<ClimateProjectionResponse>(`${BASE_URLS.climate}?${params}`);
}

// ---------------------------------------------------------------------------
// 7. Seasonal Forecast
// ---------------------------------------------------------------------------

/**
 * Fetch a long-range seasonal forecast (up to 9 months ahead).
 *
 * @example
 * const result = await getSeasonalForecast({
 *   latitude: 4.35,
 *   longitude: 114.07,
 *   daily: ["temperature_2m_max", "precipitation_sum"],
 *   forecastDays: 92,
 * });
 */
export async function getSeasonalForecast(
  options: SeasonalForecastOptions,
): Promise<ActionResult<OpenMeteoResponse>> {
  const params = buildParams({
    latitude: options.latitude,
    longitude: options.longitude,
    daily: options.daily,
    forecast_days: options.forecastDays,
    timezone: options.timezone ?? "auto",
    temperature_unit: options.temperatureUnit,
  });

  return fetchJSON<OpenMeteoResponse>(`${BASE_URLS.seasonal}?${params}`);
}

// ---------------------------------------------------------------------------
// 8. Geocoding — name/postcode → coordinates
// ---------------------------------------------------------------------------

/**
 * Search for a location by name or postal code and return its coordinates.
 *
 * Pass `includeBoundingBox: true` to also fetch a bounding box from
 * Nominatim (OpenStreetMap). This adds one extra network request but
 * enriches each result with a `bbox` field.
 *
 * @example
 * // Basic
 * const result = await geocodeLocation({ name: "Kuching", countryCode: "MY" });
 *
 * // With bounding box
 * const result = await geocodeLocation({
 *   name: "Kuching",
 *   countryCode: "MY",
 *   includeBoundingBox: true,
 * });
 * if (result.ok) console.log(result.data.results?.[0].bbox);
 */
export async function geocodeLocation(
  options: GeocodingOptions,
): Promise<ActionResult<GeocodingResponse>> {
  const params = buildParams({
    name: options.name,
    count: options.count ?? 5,
    language: options.language ?? "en",
    country_code: options.countryCode,
    format: "json",
  });

  const geoResult = await fetchJSON<GeocodingResponse>(
    `${BASE_URLS.geocoding}?${params}`,
  );

  // Return early if no bbox enrichment requested or the base call failed.
  if (!options.includeBoundingBox || !geoResult.ok) return geoResult;

  const results = geoResult.data.results;
  if (!results || results.length === 0) return geoResult;

  // Fan out one Nominatim lookup per result (typically 1–5) in parallel.
  const enriched = await Promise.all(
    results.map(async (place): Promise<GeocodingResult> => {
      try {
        const nominatimParams = new URLSearchParams({
          q: place.name,
          format: "json",
          limit: "1",
          countrycodes: place.country_code.toLowerCase(),
        });

        const res = await fetch(
          `${BASE_URLS.nominatim}?${nominatimParams}`,
          {
            headers: { "User-Agent": "wira-borneo/1.0" },
            next: { revalidate: 86400 }, // bboxes rarely change — cache 24 h
          },
        );

        if (!res.ok) return place;

        const hits = (await res.json()) as Array<{
          boundingbox?: [string, string, string, string];
        }>;

        const hit = hits[0];
        if (!hit?.boundingbox) return place;

        // Nominatim returns [south, north, west, east] as strings.
        const [south, north, west, east] = hit.boundingbox.map(Number);
        const bbox: BoundingBox = { north, south, east, west };
        return { ...place, bbox };
      } catch {
        // Non-fatal — return the place without a bbox if Nominatim fails.
        return place;
      }
    }),
  );

  return {
    ok: true,
    data: { ...geoResult.data, results: enriched },
  };
}

// ---------------------------------------------------------------------------
// 9. Elevation
// ---------------------------------------------------------------------------

/**
 * Get the elevation (metres above sea level) for a set of coordinates.
 *
 * @example
 * const result = await getElevation({ latitude: 4.35, longitude: 114.07 });
 */
export async function getElevation(
  options: { latitude: number | number[]; longitude: number | number[] },
): Promise<ActionResult<ElevationResponse>> {
  const lats = Array.isArray(options.latitude)
    ? options.latitude
    : [options.latitude];
  const lons = Array.isArray(options.longitude)
    ? options.longitude
    : [options.longitude];

  const params = buildParams({
    latitude: lats,
    longitude: lons,
  });

  return fetchJSON<ElevationResponse>(`${BASE_URLS.elevation}?${params}`);
}

// ---------------------------------------------------------------------------
// 10. Convenience: geocode then forecast in one call
// ---------------------------------------------------------------------------

/**
 * Resolve a place name to coordinates, then fetch its weather forecast.
 * Returns `{ ok: false }` if geocoding fails or no results are found.
 *
 * @example
 * const result = await getWeatherForPlace("Kota Kinabalu", {
 *   daily: ["temperature_2m_max", "precipitation_sum"],
 * });
 */
export async function getWeatherForPlace(
  placeName: string,
  forecastOptions: Omit<WeatherForecastOptions, "latitude" | "longitude">,
): Promise<ActionResult<OpenMeteoResponse>> {
  const geo = await geocodeLocation({ name: placeName, count: 1 });

  if (!geo.ok) return geo;

  const location = geo.data.results?.[0];
  if (!location) {
    return { ok: false, error: `No results found for "${placeName}"` };
  }

  return getWeatherForecast({
    ...forecastOptions,
    latitude: location.latitude,
    longitude: location.longitude,
  });
}
