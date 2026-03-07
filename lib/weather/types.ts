/**
 * Open-Meteo API – TypeScript types and enums
 *
 * Covers: weather forecast, air quality, marine, flood, ensemble,
 * seasonal, climate projection, and historical archive endpoints.
 *
 * @see https://open-meteo.com/en/docs
 */

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export enum TemperatureUnit {
  Celsius = "celsius",
  Fahrenheit = "fahrenheit",
}

export enum WindSpeedUnit {
  KilometresPerHour = "kmh",
  MetresPerSecond = "ms",
  MilesPerHour = "mph",
  Knots = "kn",
}

export enum PrecipitationUnit {
  Millimetres = "mm",
  Inches = "inch",
}

// ---------------------------------------------------------------------------
// Weather codes (WMO 4677)
// ---------------------------------------------------------------------------

export enum WeatherCode {
  ClearSky = 0,
  MainlyClear = 1,
  PartlyCloudy = 2,
  Overcast = 3,
  Fog = 45,
  DepositingRimeFog = 48,
  LightDrizzle = 51,
  ModerateDrizzle = 53,
  DenseDrizzle = 55,
  LightFreezingDrizzle = 56,
  DenseFreezingDrizzle = 57,
  SlightRain = 61,
  ModerateRain = 63,
  HeavyRain = 65,
  LightFreezingRain = 66,
  HeavyFreezingRain = 67,
  SlightSnowfall = 71,
  ModerateSnowfall = 73,
  HeavySnowfall = 75,
  SnowGrains = 77,
  SlightRainShowers = 80,
  ModerateRainShowers = 81,
  ViolentRainShowers = 82,
  SlightSnowShowers = 85,
  HeavySnowShowers = 86,
  SlightOrModerateThunderstorm = 95,
  ThunderstormWithSlightHail = 96,
  ThunderstormWithHeavyHail = 99,
}

// ---------------------------------------------------------------------------
// Forecast variables
// ---------------------------------------------------------------------------

export type HourlyVariable =
  | "temperature_2m"
  | "relative_humidity_2m"
  | "dewpoint_2m"
  | "apparent_temperature"
  | "precipitation_probability"
  | "precipitation"
  | "rain"
  | "showers"
  | "snowfall"
  | "snow_depth"
  | "weather_code"
  | "pressure_msl"
  | "surface_pressure"
  | "cloud_cover"
  | "cloud_cover_low"
  | "cloud_cover_mid"
  | "cloud_cover_high"
  | "visibility"
  | "evapotranspiration"
  | "et0_fao_evapotranspiration"
  | "vapour_pressure_deficit"
  | "wind_speed_10m"
  | "wind_speed_80m"
  | "wind_speed_120m"
  | "wind_speed_180m"
  | "wind_direction_10m"
  | "wind_direction_80m"
  | "wind_direction_120m"
  | "wind_direction_180m"
  | "wind_gusts_10m"
  | "temperature_80m"
  | "temperature_120m"
  | "temperature_180m"
  | "uv_index"
  | "uv_index_clear_sky"
  | "is_day"
  | "sunshine_duration"
  | "cape"
  | "lifted_index"
  | "freezing_level_height"
  | "soil_temperature_0cm"
  | "soil_temperature_6cm"
  | "soil_temperature_18cm"
  | "soil_temperature_54cm"
  | "soil_moisture_0_to_1cm"
  | "soil_moisture_1_to_3cm"
  | "soil_moisture_3_to_9cm"
  | "soil_moisture_9_to_27cm"
  | "soil_moisture_27_to_81cm"
  | "shortwave_radiation"
  | "direct_radiation"
  | "diffuse_radiation"
  | "direct_normal_irradiance"
  | "global_tilted_irradiance";

export type DailyVariable =
  | "weather_code"
  | "temperature_2m_max"
  | "temperature_2m_min"
  | "temperature_2m_mean"
  | "apparent_temperature_max"
  | "apparent_temperature_min"
  | "apparent_temperature_mean"
  | "sunrise"
  | "sunset"
  | "daylight_duration"
  | "sunshine_duration"
  | "uv_index_max"
  | "uv_index_clear_sky_max"
  | "rain_sum"
  | "showers_sum"
  | "snowfall_sum"
  | "precipitation_sum"
  | "precipitation_hours"
  | "precipitation_probability_max"
  | "precipitation_probability_mean"
  | "precipitation_probability_min"
  | "wind_speed_10m_max"
  | "wind_speed_10m_mean"
  | "wind_speed_10m_min"
  | "wind_gusts_10m_max"
  | "wind_gusts_10m_mean"
  | "wind_gusts_10m_min"
  | "wind_direction_10m_dominant"
  | "shortwave_radiation_sum"
  | "et0_fao_evapotranspiration"
  | "et0_fao_evapotranspiration_sum"
  | "cloud_cover_mean"
  | "cloud_cover_max"
  | "cloud_cover_min"
  | "pressure_msl_mean"
  | "pressure_msl_max"
  | "pressure_msl_min"
  | "relative_humidity_2m_mean"
  | "relative_humidity_2m_max"
  | "relative_humidity_2m_min"
  | "dewpoint_2m_mean"
  | "dewpoint_2m_max"
  | "dewpoint_2m_min"
  | "visibility_mean"
  | "visibility_max"
  | "visibility_min"
  | "cape_mean"
  | "cape_max"
  | "cape_min"
  | "vapour_pressure_deficit_max"
  | "growing_degree_days_base_0_limit_50"
  | "leaf_wetness_probability_mean"
  | "leaf_wetness_probability_max"
  | "leaf_wetness_probability_min"
  | "snowfall_water_equivalent_sum";

// ---------------------------------------------------------------------------
// Air quality variables
// ---------------------------------------------------------------------------

export type AirQualityHourlyVariable =
  | "pm10"
  | "pm2_5"
  | "carbon_monoxide"
  | "nitrogen_dioxide"
  | "ozone"
  | "sulphur_dioxide"
  | "ammonia"
  | "dust"
  | "aerosol_optical_depth"
  | "carbon_dioxide"
  | "methane"
  | "alder_pollen"
  | "birch_pollen"
  | "grass_pollen"
  | "mugwort_pollen"
  | "olive_pollen"
  | "ragweed_pollen"
  | "european_aqi"
  | "european_aqi_pm2_5"
  | "european_aqi_pm10"
  | "european_aqi_nitrogen_dioxide"
  | "european_aqi_ozone"
  | "european_aqi_sulphur_dioxide"
  | "us_aqi"
  | "us_aqi_pm2_5"
  | "us_aqi_pm10"
  | "us_aqi_nitrogen_dioxide"
  | "us_aqi_ozone"
  | "us_aqi_sulphur_dioxide"
  | "us_aqi_carbon_monoxide"
  | "uv_index"
  | "uv_index_clear_sky";

// ---------------------------------------------------------------------------
// Marine variables
// ---------------------------------------------------------------------------

export type MarineHourlyVariable =
  | "wave_height"
  | "wave_direction"
  | "wave_period"
  | "wave_peak_period"
  | "wind_wave_height"
  | "wind_wave_direction"
  | "wind_wave_period"
  | "wind_wave_peak_period"
  | "swell_wave_height"
  | "swell_wave_direction"
  | "swell_wave_period"
  | "swell_wave_peak_period"
  | "secondary_swell_wave_height"
  | "secondary_swell_wave_period"
  | "secondary_swell_wave_direction"
  | "sea_surface_temperature"
  | "ocean_current_velocity"
  | "ocean_current_direction";

export type MarineDailyVariable =
  | "wave_height_max"
  | "wave_direction_dominant"
  | "wave_period_max"
  | "wind_wave_height_max"
  | "wind_wave_direction_dominant"
  | "wind_wave_period_max"
  | "wind_wave_peak_period_max"
  | "swell_wave_height_max"
  | "swell_wave_direction_dominant"
  | "swell_wave_period_max"
  | "swell_wave_peak_period_max";

// ---------------------------------------------------------------------------
// River discharge variables
// ---------------------------------------------------------------------------

export type FloodDailyVariable =
  | "river_discharge"
  | "river_discharge_mean"
  | "river_discharge_median"
  | "river_discharge_max"
  | "river_discharge_min"
  | "river_discharge_p25"
  | "river_discharge_p75";

// ---------------------------------------------------------------------------
// Climate projection variables
// ---------------------------------------------------------------------------

export type ClimateDailyVariable =
  | "temperature_2m_max"
  | "temperature_2m_min"
  | "temperature_2m_mean"
  | "cloud_cover_mean"
  | "relative_humidity_2m_max"
  | "relative_humidity_2m_min"
  | "relative_humidity_2m_mean"
  | "soil_moisture_0_to_10cm_mean"
  | "precipitation_sum"
  | "rain_sum"
  | "snowfall_sum"
  | "wind_speed_10m_mean"
  | "wind_speed_10m_max"
  | "pressure_msl_mean"
  | "shortwave_radiation_sum";

export enum ClimateModel {
  CMCC_CM2_VHR4 = "CMCC_CM2_VHR4",
  FGOALS_f3_H = "FGOALS_f3_H",
  HiRAM_SIT_HR = "HiRAM_SIT_HR",
  MRI_AGCM3_2_S = "MRI_AGCM3_2_S",
  EC_Earth3P_HR = "EC_Earth3P_HR",
  MPI_ESM1_2_XR = "MPI_ESM1_2_XR",
  NICAM16_8S = "NICAM16_8S",
}

// ---------------------------------------------------------------------------
// Model identifiers
// ---------------------------------------------------------------------------

export enum WeatherModel {
  // Auto-select (recommended)
  BestMatch = "best_match",
  // ECMWF
  ECMWF_IFS_HRES_9km = "ecmwf_ifs_hres_9km",
  ECMWF_IFS_025 = "ecmwf_ifs_025",
  ECMWF_AIFS_025_Single = "ecmwf_aifs_025_single",
  // NCEP / GFS
  NCEP_GFS_Seamless = "ncep_gfs_seamless",
  NCEP_GFS_Global = "ncep_gfs_global",
  NCEP_HRRR = "ncep_hrrr_us_conus",
  NCEP_NBM = "ncep_nbm_us_conus",
  NCEP_NAM = "ncep_nam_us_conus",
  NCEP_GFS_GraphCast = "ncep_gfs_graphcast",
  // DWD ICON
  DWD_ICON_Seamless = "dwd_icon_seamless",
  DWD_ICON_Global = "dwd_icon_global",
  DWD_ICON_EU = "dwd_icon_eu",
  DWD_ICON_D2 = "dwd_icon_d2",
  // Météo-France
  MétéoFrance_Seamless = "meteofrance_seamless",
  MétéoFrance_ARPEGE_World = "meteofrance_arpege_world",
  MétéoFrance_ARPEGE_Europe = "meteofrance_arpege_europe",
  MétéoFrance_AROME_France = "meteofrance_arome_france",
  MétéoFrance_AROME_HD = "meteofrance_arome_france_hd",
  // GEM / Canada
  GEM_Seamless = "gem_seamless",
  GEM_Global = "gem_global",
  GEM_Regional = "gem_regional",
  GEM_HRDPS_Continental = "gem_hrdps_continental",
  // UK Met Office
  UKMO_Seamless = "uk_met_office_seamless",
  UKMO_Global_10km = "uk_met_office_global_10km",
  UKMO_UK_2km = "uk_met_office_uk_2km",
  // JMA
  JMA_Seamless = "jma_seamless",
  JMA_MSM = "jma_msm",
  JMA_GSM = "jma_gsm",
  // MeteoSwiss
  MeteoSwiss_Seamless = "meteoswiss_icon_seamless",
  MeteoSwiss_CH1 = "meteoswiss_icon_ch1",
  MeteoSwiss_CH2 = "meteoswiss_icon_ch2",
}

// ---------------------------------------------------------------------------
// Base request parameters
// ---------------------------------------------------------------------------

export interface LatLon {
  /** Latitude in WGS84 (−90 to 90) */
  latitude: number;
  /** Longitude in WGS84 (−180 to 180) */
  longitude: number;
}

export interface BaseRequestOptions extends LatLon {
  timezone?: string;
  temperatureUnit?: TemperatureUnit;
  windSpeedUnit?: WindSpeedUnit;
  precipitationUnit?: PrecipitationUnit;
}

// ---------------------------------------------------------------------------
// Weather forecast request
// ---------------------------------------------------------------------------

export interface WeatherForecastOptions extends BaseRequestOptions {
  hourly?: HourlyVariable[];
  daily?: DailyVariable[];
  /** Number of forecast days (1–16). Defaults to 7. */
  forecastDays?: number;
  /** Include past days (0–7). */
  pastDays?: number;
  /** Override the automatically-selected weather model. */
  model?: WeatherModel;
  /** Include current weather conditions. */
  currentWeather?: boolean;
}

// ---------------------------------------------------------------------------
// Air quality request
// ---------------------------------------------------------------------------

export interface AirQualityOptions extends LatLon {
  hourly: AirQualityHourlyVariable[];
  timezone?: string;
  forecastDays?: number;
  pastDays?: number;
}

// ---------------------------------------------------------------------------
// Marine weather request
// ---------------------------------------------------------------------------

export interface MarineWeatherOptions extends LatLon {
  hourly?: MarineHourlyVariable[];
  daily?: MarineDailyVariable[];
  timezone?: string;
  forecastDays?: number;
  pastDays?: number;
}

// ---------------------------------------------------------------------------
// Flood / river discharge request
// ---------------------------------------------------------------------------

export interface FloodForecastOptions extends LatLon {
  daily?: FloodDailyVariable[];
  timezone?: string;
  forecastDays?: number;
  pastDays?: number;
  ensemble?: boolean;
}

// ---------------------------------------------------------------------------
// Historical archive request
// ---------------------------------------------------------------------------

export interface WeatherArchiveOptions extends LatLon {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  hourly?: Array<
    | "temperature_2m"
    | "relative_humidity_2m"
    | "precipitation"
    | "pressure_msl"
    | "wind_speed_10m"
    | "wind_direction_10m"
    | "shortwave_radiation"
  >;
  daily?: Array<
    | "temperature_2m_max"
    | "temperature_2m_min"
    | "precipitation_sum"
    | "wind_speed_10m_max"
    | "shortwave_radiation_sum"
  >;
  timezone?: string;
  temperatureUnit?: TemperatureUnit;
}

// ---------------------------------------------------------------------------
// Climate projection request
// ---------------------------------------------------------------------------

export interface ClimateProjectionOptions extends LatLon {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  models: ClimateModel[];
  daily: ClimateDailyVariable[];
  temperatureUnit?: TemperatureUnit;
  windSpeedUnit?: WindSpeedUnit;
  precipitationUnit?: PrecipitationUnit;
  disableBiasCorrection?: boolean;
}

// ---------------------------------------------------------------------------
// Seasonal forecast request
// ---------------------------------------------------------------------------

export interface SeasonalForecastOptions extends LatLon {
  daily?: Array<
    | "temperature_2m_max"
    | "temperature_2m_min"
    | "shortwave_radiation_sum"
    | "precipitation_sum"
    | "rain_sum"
    | "precipitation_hours"
    | "wind_speed_10m_max"
    | "wind_direction_10m_dominant"
  >;
  /** 45, 92 (default), 183, or 274 days */
  forecastDays?: 45 | 92 | 183 | 274;
  timezone?: string;
  temperatureUnit?: TemperatureUnit;
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

/**
 * Axis-aligned bounding box in decimal degrees (WGS84).
 * Sourced from Nominatim when `includeBoundingBox` is requested.
 */
export interface BoundingBox {
  /** Northern boundary (max latitude) */
  north: number;
  /** Southern boundary (min latitude) */
  south: number;
  /** Eastern boundary (max longitude) */
  east: number;
  /** Western boundary (min longitude) */
  west: number;
}

export interface GeocodingOptions {
  name: string;
  count?: number;
  language?: string;
  countryCode?: string;
  /**
   * When true, each result will be enriched with a `bbox` field
   * sourced from a secondary Nominatim (OpenStreetMap) lookup.
   * Note: this adds one extra network request per geocoding call.
   */
  includeBoundingBox?: boolean;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  country: string;
  admin1?: string;
  admin2?: string;
  timezone: string;
  population?: number;
  /** Present only when `GeocodingOptions.includeBoundingBox` is true. */
  bbox?: BoundingBox;
}

// ---------------------------------------------------------------------------
// Generic API response shape
// ---------------------------------------------------------------------------

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units?: Record<string, string>;
  hourly?: Record<string, (number | null)[]>;
  daily_units?: Record<string, string>;
  daily?: Record<string, (number | string | null)[]>;
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: WeatherCode;
    is_day: 0 | 1;
    time: string;
  };
}

export interface AirQualityResponse extends OpenMeteoResponse {}
export interface MarineWeatherResponse extends OpenMeteoResponse {}
export interface FloodForecastResponse extends OpenMeteoResponse {}

export interface ClimateProjectionResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units?: Record<string, string>;
  daily?: Record<string, (number | null)[]>;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms: number;
}

export interface ElevationResponse {
  latitude: number;
  longitude: number;
  elevation: number[];
  generationtime_ms: number;
}

// ---------------------------------------------------------------------------
// Action result wrapper (for Next.js Server Actions)
// ---------------------------------------------------------------------------

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
