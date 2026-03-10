import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { RoutingService } from '../../routing/routing.service';
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
}

@Injectable()
export class EvacuationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingProvider: SimpleRoutingProvider,
    private readonly routingService: RoutingService,
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
    const withRoute: NearestEvacResult[] = [];
    for (const { area } of topN) {
      const route = await this.routingService.getRoute(
        longitude,
        latitude,
        area.longitude,
        area.latitude,
        vehicleType,
      );
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
        durationSeconds: route?.durationSeconds,
        distanceMeters: route?.distanceMeters,
      });
    }
    withRoute.sort((a, b) => (a.durationSeconds ?? 1e9) - (b.durationSeconds ?? 1e9));
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
