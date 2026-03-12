import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { RoutingService } from '../../routing/routing.service';
import { HttpHazardRoutingProvider } from './hazard-routing.provider';
import { SimpleRoutingProvider } from './simple-routing.provider';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearestEvacResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  region: string | null;
  type?: string | null;
  capacity?: string | null;
  population?: string | null;
  source?: string | null;
  durationSeconds?: number;
  distanceMeters?: number;
  /** Present when hazard-aware routing was used (rainfall_mm provided). */
  geometry?: { type: 'LineString'; coordinates: [number, number][] };
  avgRisk?: number;
  totalRiskCost?: number;
  hazardAware?: boolean;
}

@Injectable()
export class EvacuationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingProvider: SimpleRoutingProvider,
    private readonly routingService: RoutingService,
    private readonly hazardRoutingProvider: HttpHazardRoutingProvider,
  ) {}

  async getAreas() {
    return this.prisma.evacuationArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getNearest(
    latitude: number,
    longitude: number,
    limit = 10,
    vehicleType = 'driving',
    rainfallMm?: number,
  ): Promise<NearestEvacResult[]> {
    const areas = await this.prisma.evacuationArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    const withDistance = areas.map((a) => ({
      area: a,
      distanceKm: haversineKm(latitude, longitude, a.latitude, a.longitude),
    }));
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    const topN = withDistance.slice(0, Math.min(limit, 5));
    const useHazard = typeof rainfallMm === 'number';
    const withRoute: NearestEvacResult[] = [];

    for (const { area } of topN) {
      let durationSeconds: number | undefined;
      let distanceMeters: number | undefined;
      let geometry: NearestEvacResult['geometry'];
      let avgRisk: number | undefined;
      let totalRiskCost: number | undefined;
      let hazardAware = false;

      if (useHazard) {
        const hazardRoute = await this.hazardRoutingProvider.getHazardAwareRoute(
          latitude,
          longitude,
          area.latitude,
          area.longitude,
          rainfallMm,
        );
        if (hazardRoute) {
          durationSeconds = hazardRoute.durationSeconds;
          distanceMeters = hazardRoute.distanceMeters;
          geometry = hazardRoute.geometry;
          avgRisk = hazardRoute.avgRisk;
          totalRiskCost = hazardRoute.totalRiskCost;
          hazardAware = true;
        }
      }

      if (!hazardAware) {
        const route = await this.routingService.getRoute(
          longitude,
          latitude,
          area.longitude,
          area.latitude,
          vehicleType,
        );
        durationSeconds = route?.durationSeconds;
        distanceMeters = route?.distanceMeters;
        if (route) geometry = route.geometry;
      }

      withRoute.push({
        id: area.id,
        name: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        address: area.address,
        region: area.region,
        type: area.type,
        capacity: area.capacity,
        population: area.population,
        source: area.source,
        durationSeconds,
        distanceMeters,
        ...(geometry && { geometry }),
        ...(avgRisk !== undefined && { avgRisk }),
        ...(totalRiskCost !== undefined && { totalRiskCost }),
        ...(hazardAware && { hazardAware: true }),
      });
    }

    if (useHazard && withRoute.some((r) => r.avgRisk !== undefined)) {
      withRoute.sort((a, b) => (a.avgRisk ?? 1) - (b.avgRisk ?? 1));
    } else {
      withRoute.sort((a, b) => (a.durationSeconds ?? 1e9) - (b.durationSeconds ?? 1e9));
    }

    const rest = withDistance.slice(5, limit).map(({ area }) => ({
      id: area.id,
      name: area.name,
      latitude: area.latitude,
      longitude: area.longitude,
      address: area.address,
      region: area.region,
      type: area.type,
      capacity: area.capacity,
      population: area.population,
      source: area.source,
    }));
    return [...withRoute, ...rest];
  }

  /**
   * Hazard-aware route between two coordinates (no evacuation area).
   * Returns null if hazard server is unavailable.
   */
  async getHazardRoute(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    rainfallMm: number,
  ): Promise<{
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    durationSeconds: number;
    distanceMeters: number;
    avgRisk: number;
    totalRiskCost: number;
  } | null> {
    const result = await this.hazardRoutingProvider.getHazardAwareRoute(
      fromLat,
      fromLon,
      toLat,
      toLon,
      rainfallMm,
    );
    if (!result) return null;
    return {
      geometry: result.geometry,
      durationSeconds: result.durationSeconds,
      distanceMeters: result.distanceMeters,
      avgRisk: result.avgRisk,
      totalRiskCost: result.totalRiskCost,
    };
  }

  async getRouteToArea(
    latitude: number,
    longitude: number,
    evacuationAreaId: string,
    vehicleType = 'driving',
    rainfallMm?: number,
  ): Promise<{
    evacuationArea: { id: string; name: string; latitude: number; longitude: number; address: string | null; region: string | null };
    geometry?: { type: 'LineString'; coordinates: [number, number][] };
    durationSeconds?: number;
    distanceMeters?: number;
    avgRisk?: number;
    totalRiskCost?: number;
    hazardAware?: boolean;
  } | null> {
    const area = await this.prisma.evacuationArea.findFirst({
      where: { id: evacuationAreaId, isActive: true },
    });
    if (!area) return null;

    const useHazard = typeof rainfallMm === 'number';
    if (useHazard) {
      const hazardRoute = await this.hazardRoutingProvider.getHazardAwareRoute(
        latitude,
        longitude,
        area.latitude,
        area.longitude,
        rainfallMm,
      );
      if (hazardRoute) {
        return {
          evacuationArea: {
            id: area.id,
            name: area.name,
            latitude: area.latitude,
            longitude: area.longitude,
            address: area.address,
            region: area.region,
          },
          geometry: hazardRoute.geometry,
          durationSeconds: hazardRoute.durationSeconds,
          distanceMeters: hazardRoute.distanceMeters,
          avgRisk: hazardRoute.avgRisk,
          totalRiskCost: hazardRoute.totalRiskCost,
          hazardAware: true,
        };
      }
    }

    const route = await this.routingService.getRoute(
      longitude,
      latitude,
      area.longitude,
      area.latitude,
      vehicleType,
    );
    if (!route) return null;
    return {
      evacuationArea: {
        id: area.id,
        name: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        address: area.address,
        region: area.region,
      },
      geometry: route.geometry,
      durationSeconds: route.durationSeconds,
      distanceMeters: route.distanceMeters,
    };
  }

  async getSuggestedRoutes(userId: string) {
    const [location, warning] = await Promise.all([
      this.prisma.userLocationSnapshot.findUnique({
        where: { userId },
      }),
      this.prisma.warningEvent.findFirst({
        where: {
          status: 'SENT',
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        },
        include: {
          evacuationAreas: {
            include: {
              evacuationArea: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!location || !warning || warning.evacuationAreas.length === 0) {
      return [];
    }

    try {
      const suggestions = await Promise.all(
        warning.evacuationAreas.map(async (link) => {
          const result = await this.routingProvider.suggestRoute({
            warningEventId: warning.id,
            userId,
            evacuationAreaId: link.evacuationArea.id,
            originLatitude: location.latitude,
            originLongitude: location.longitude,
            destinationLatitude: link.evacuationArea.latitude,
            destinationLongitude: link.evacuationArea.longitude,
          });

          return this.prisma.evacuationRouteSuggestion.create({
            data: {
              warningEventId: warning.id,
              userId,
              evacuationAreaId: link.evacuationArea.id,
              originLatitude: location.latitude,
              originLongitude: location.longitude,
              etaMinutes: result.etaMinutes,
              distanceMeters: result.distanceMeters,
              polylineGeoJson: result.polylineGeoJson,
              provider: result.provider,
            },
            include: {
              evacuationArea: true,
            },
          });
        }),
      );

      return suggestions;
    } catch {
      throw new ServiceUnavailableException(
        'Route suggestions are temporarily unavailable. Please use recommended evacuation areas directly.',
      );
    }
  }
}
