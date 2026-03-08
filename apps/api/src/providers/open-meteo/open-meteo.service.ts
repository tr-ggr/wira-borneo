import { Injectable } from '@nestjs/common';
import {
  OpenMeteoProviderError,
  type OpenMeteoForecastParams,
  type OpenMeteoForecastResponse,
  type OpenMeteoGeocodingParams,
  type OpenMeteoGeocodingResponse,
} from './open-meteo.types';

@Injectable()
export class OpenMeteoService {
  private readonly weatherBaseUrl = 'https://api.open-meteo.com/v1';
  private readonly geocodingBaseUrl = 'https://geocoding-api.open-meteo.com/v1';

  async getForecast(
    params: OpenMeteoForecastParams,
  ): Promise<OpenMeteoForecastResponse> {
    this.assertForecastParams(params);

    return this.requestJson<OpenMeteoForecastResponse>({
      operation: 'forecast',
      url: `${this.weatherBaseUrl}/forecast?${this.serializeQuery(params)}`,
    });
  }

  async getGeocoding(
    params: OpenMeteoGeocodingParams,
  ): Promise<OpenMeteoGeocodingResponse> {
    this.assertGeocodingParams(params);

    const query = {
      name: params.name,
      count: params.count,
      language: params.language,
      country_code: params.countryCode,
      format: params.format,
    };

    return this.requestJson<OpenMeteoGeocodingResponse>({
      operation: 'geocoding',
      url: `${this.geocodingBaseUrl}/search?${this.serializeQuery(query)}`,
    });
  }

  private assertForecastParams(params: OpenMeteoForecastParams): void {
    const { latitude, longitude, forecast_days: forecastDays } = params;

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new OpenMeteoProviderError(
        'Invalid forecast parameters: latitude must be between -90 and 90.',
        { operation: 'forecast' },
      );
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new OpenMeteoProviderError(
        'Invalid forecast parameters: longitude must be between -180 and 180.',
        { operation: 'forecast' },
      );
    }

    if (
      forecastDays !== undefined &&
      (!Number.isInteger(forecastDays) || forecastDays < 1 || forecastDays > 16)
    ) {
      throw new OpenMeteoProviderError(
        'Invalid forecast parameters: forecast_days must be an integer between 1 and 16.',
        { operation: 'forecast' },
      );
    }
  }

  private assertGeocodingParams(params: OpenMeteoGeocodingParams): void {
    if (params.name.trim().length < 2) {
      throw new OpenMeteoProviderError(
        'Invalid geocoding parameters: name must contain at least 2 characters.',
        { operation: 'geocoding' },
      );
    }

    if (
      params.count !== undefined &&
      (!Number.isInteger(params.count) || params.count < 1 || params.count > 100)
    ) {
      throw new OpenMeteoProviderError(
        'Invalid geocoding parameters: count must be an integer between 1 and 100.',
        { operation: 'geocoding' },
      );
    }
  }

  private serializeQuery(
    params: Record<string, unknown>,
  ): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          query.set(key, value.join(','));
        }
        continue;
      }

      query.set(key, String(value));
    }

    return query.toString();
  }

  private async requestJson<T>(input: {
    operation: string;
    url: string;
  }): Promise<T> {
    let response: Response;

    try {
      response = await fetch(input.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      throw new OpenMeteoProviderError(
        `Open-Meteo ${input.operation} request failed before receiving a response.`,
        {
          operation: input.operation,
          cause: error,
        },
      );
    }

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;

      try {
        const payload = (await response.json()) as { reason?: string; error?: string };
        detail = payload.reason ?? payload.error ?? detail;
      } catch {
        // Keep HTTP status detail fallback if the upstream body is not JSON.
      }

      throw new OpenMeteoProviderError(
        `Open-Meteo ${input.operation} request failed: ${detail}`,
        {
          operation: input.operation,
          status: response.status,
        },
      );
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new OpenMeteoProviderError(
        `Open-Meteo ${input.operation} response could not be parsed as JSON.`,
        {
          operation: input.operation,
          status: response.status,
          cause: error,
        },
      );
    }
  }
}