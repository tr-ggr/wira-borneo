export type OpenMeteoTemperatureUnit = 'celsius' | 'fahrenheit';

export type OpenMeteoWindSpeedUnit = 'kmh' | 'ms' | 'mph' | 'kn';

export type OpenMeteoPrecipitationUnit = 'mm' | 'inch';

export type OpenMeteoTimezone = 'auto' | string;

export type OpenMeteoModel =
  | 'ecmwf_ifs_hres_9km'
  | 'ecmwf_ifs_025'
  | 'ecmwf_aifs_025_single'
  | 'cma_grapes_global'
  | 'bom_access_global'
  | 'ncep_gfs_seamless'
  | 'ncep_gfs_global'
  | 'ncep_hrrr_us_conus'
  | 'ncep_nbm_us_conus'
  | 'ncep_nam_us_conus'
  | 'ncep_gfs_graphcast'
  | 'ncep_aigfs_025'
  | 'ncep_hgefs_025_ensemble_mean'
  | 'jma_seamless'
  | 'jma_msm'
  | 'jma_gsm'
  | 'kma_seamless'
  | 'kma_ldps'
  | 'kma_gdps'
  | 'dwd_icon_seamless'
  | 'dwd_icon_global'
  | 'dwd_icon_eu'
  | 'dwd_icon_d2'
  | 'gem_seamless'
  | 'gem_global'
  | 'gem_regional'
  | 'gem_hrdps_continental'
  | 'gem_hrdps_west'
  | 'meteofrance_seamless'
  | 'meteofrance_arpege_world'
  | 'meteofrance_arpege_europe'
  | 'meteofrance_arome_france'
  | 'meteofrance_arome_france_hd'
  | 'italiameteo_arpae_icon_2i'
  | 'met_norway_nordic_seamless'
  | 'met_norway_nordic'
  | 'knmi_seamless'
  | 'knmi_harmonie_arome_europe'
  | 'knmi_harmonie_arome_netherlands'
  | 'dmi_seamless'
  | 'dmi_harmonie_arome_europe'
  | 'uk_met_office_seamless'
  | 'uk_met_office_global_10km'
  | 'uk_met_office_uk_2km'
  | 'meteoswiss_icon_seamless'
  | 'meteoswiss_icon_ch1'
  | 'meteoswiss_icon_ch2';

export type OpenMeteoForecastHourlyVariable =
  | 'temperature_2m'
  | 'relative_humidity_2m'
  | 'dewpoint_2m'
  | 'apparent_temperature'
  | 'precipitation_probability'
  | 'precipitation'
  | 'rain'
  | 'showers'
  | 'snowfall'
  | 'snow_depth'
  | 'weather_code'
  | 'pressure_msl'
  | 'surface_pressure'
  | 'cloud_cover'
  | 'cloud_cover_low'
  | 'cloud_cover_mid'
  | 'cloud_cover_high'
  | 'visibility'
  | 'evapotranspiration'
  | 'et0_fao_evapotranspiration'
  | 'vapour_pressure_deficit'
  | 'wind_speed_10m'
  | 'wind_direction_10m'
  | 'wind_gusts_10m'
  | 'uv_index'
  | 'uv_index_clear_sky'
  | 'is_day'
  | 'sunshine_duration';

export type OpenMeteoForecastDailyVariable =
  | 'weather_code'
  | 'temperature_2m_max'
  | 'temperature_2m_min'
  | 'temperature_2m_mean'
  | 'apparent_temperature_max'
  | 'apparent_temperature_min'
  | 'sunrise'
  | 'sunset'
  | 'daylight_duration'
  | 'sunshine_duration'
  | 'uv_index_max'
  | 'precipitation_sum'
  | 'precipitation_probability_max'
  | 'rain_sum'
  | 'showers_sum'
  | 'snowfall_sum'
  | 'wind_speed_10m_max'
  | 'wind_gusts_10m_max'
  | 'wind_direction_10m_dominant'
  | 'shortwave_radiation_sum';

export interface OpenMeteoForecastParams {
  latitude: number;
  longitude: number;
  hourly?: OpenMeteoForecastHourlyVariable[];
  daily?: OpenMeteoForecastDailyVariable[];
  current_weather?: boolean;
  temperature_unit?: OpenMeteoTemperatureUnit;
  wind_speed_unit?: OpenMeteoWindSpeedUnit;
  precipitation_unit?: OpenMeteoPrecipitationUnit;
  timezone?: OpenMeteoTimezone;
  past_days?: 1 | 2;
  forecast_days?: number;
  models?: OpenMeteoModel;
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather?: Record<string, number | string | null>;
  hourly_units?: Record<string, string>;
  hourly?: Record<string, Array<number | string | null>>;
  daily_units?: Record<string, string>;
  daily?: Record<string, Array<number | string | null>>;
}

export interface OpenMeteoGeocodingParams {
  name: string;
  count?: number;
  language?: string;
  countryCode?: string;
  format?: 'json' | 'protobuf';
}

export interface OpenMeteoGeocodingResult {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone?: string;
  population?: number;
}

export interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
  generationtime_ms: number;
}

export class OpenMeteoProviderError extends Error {
  readonly operation: string;
  readonly status?: number;
  override readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      operation: string;
      status?: number;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'OpenMeteoProviderError';
    this.operation = options.operation;
    this.status = options.status;
    this.cause = options.cause;
  }
}