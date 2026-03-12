import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { getHazardRoutingConfig } from '../../../config';

export interface HazardRouteResult {
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  durationSeconds: number;
  distanceMeters: number;
  avgRisk: number;
  totalRiskCost: number;
}

export interface HazardRiskPoint {
  latitude: number;
  longitude: number;
  risk: number;
  elevation?: number;
  stagnation?: number;
  vulnerability?: number;
}

export interface HazardRoutingProvider {
  getHazardAwareRoute(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    rainfallMm: number,
  ): Promise<HazardRouteResult | null>;

  getRiskPoints(rainfallMm?: number): Promise<HazardRiskPoint[]>;
}

@Injectable()
export class HttpHazardRoutingProvider implements HazardRoutingProvider {
  private readonly logger = new Logger(HttpHazardRoutingProvider.name);
  private loggedNoConfig = false;

  private logOnceNoConfig(): void {
    if (!this.loggedNoConfig) {
      this.logger.warn(
        'HAZARD_ROUTING_SERVER_URL not set; hazard risk layer and hazard-aware routes disabled.',
      );
      this.loggedNoConfig = true;
    }
  }

  async getHazardAwareRoute(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    rainfallMm: number,
  ): Promise<HazardRouteResult | null> {
    const config = getHazardRoutingConfig();
    if (!config) {
      this.logOnceNoConfig();
      return null;
    }

    try {
      const response = await axios.post<{
        geometry?: { type: string; coordinates: [number, number][] };
        distance_meters?: number;
        duration_seconds?: number;
        avg_risk?: number;
        total_risk_cost?: number;
      }>(
        `${config.hazardRoutingServerUrl.replace(/\/$/, '')}/route`,
        {
          from_lat: fromLat,
          from_lon: fromLon,
          to_lat: toLat,
          to_lon: toLon,
          rainfall_mm: rainfallMm,
        },
        { timeout: config.hazardRoutingTimeoutMs },
      );

      const data = response.data;
      if (!data?.geometry?.coordinates?.length) return null;

      return {
        geometry: {
          type: 'LineString',
          coordinates: data.geometry.coordinates,
        },
        durationSeconds: data.duration_seconds ?? 0,
        distanceMeters: data.distance_meters ?? 0,
        avgRisk: data.avg_risk ?? 0,
        totalRiskCost: data.total_risk_cost ?? 0,
      };
    } catch (error: unknown) {
      const url = `${config.hazardRoutingServerUrl.replace(/\/$/, '')}/route`;
      const msg = error instanceof Error ? error.message : String(error);
      const axiosErr = error as { code?: string; response?: { status?: number; data?: unknown } };
      const detail =
        axiosErr.response != null
          ? ` status=${axiosErr.response.status} body=${JSON.stringify(axiosErr.response.data)}`
          : axiosErr.code != null
            ? ` code=${axiosErr.code}`
            : '';
      this.logger.warn(
        `Hazard routing request failed (fallback to OSRM): ${msg} (${url})${detail}`,
      );
      return null;
    }
  }

  async getRiskPoints(rainfallMm = 0): Promise<HazardRiskPoint[]> {
    const config = getHazardRoutingConfig();
    if (!config) {
      this.logOnceNoConfig();
      return [];
    }

    try {
      const response = await axios.get<{ points?: Array<{ lat: number; lon: number; risk: number; elevation?: number; stagnation?: number; vulnerability?: number }> }>(
        `${config.hazardRoutingServerUrl.replace(/\/$/, '')}/risk-points`,
        { params: { rainfall_mm: rainfallMm }, timeout: config.hazardRoutingTimeoutMs },
      );
      const points = response.data?.points ?? [];
      return points.map((p) => ({
        latitude: p.lat,
        longitude: p.lon,
        risk: p.risk,
        elevation: p.elevation,
        stagnation: p.stagnation,
        vulnerability: p.vulnerability,
      }));
    } catch (error: unknown) {
      const url = `${config.hazardRoutingServerUrl.replace(/\/$/, '')}/risk-points`;
      const msg = error instanceof Error ? error.message : String(error);
      const axiosErr = error as { code?: string; response?: { status?: number; data?: unknown } };
      const detail =
        axiosErr.response != null
          ? ` status=${axiosErr.response.status} body=${JSON.stringify(axiosErr.response.data)}`
          : axiosErr.code != null
            ? ` code=${axiosErr.code}`
            : '';
      this.logger.warn(
        `Hazard risk-points request failed: ${msg} (${url})${detail}`,
      );
      return [];
    }
  }
}
