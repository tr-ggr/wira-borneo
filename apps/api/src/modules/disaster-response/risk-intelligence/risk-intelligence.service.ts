import { Injectable } from '@nestjs/common';
import { OpenMeteoService } from '../../../providers/open-meteo/open-meteo.service';
import { PrismaService } from '../../../core/database/database.service';
import { withinRadiusKm } from '../shared/geo.util';

@Injectable()
export class RiskIntelligenceService {
  constructor(
    private readonly openMeteoService: OpenMeteoService,
    private readonly prisma: PrismaService,
  ) {}

  async getForecast(latitude: number, longitude: number, forecastDays = 3) {
    const forecast = await this.openMeteoService.getForecast({
      latitude,
      longitude,
      forecast_days: forecastDays,
      hourly: ['temperature_2m', 'precipitation_probability', 'wind_speed_10m'],
      daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'],
      timezone: 'auto',
    });

    return {
      location: {
        latitude,
        longitude,
      },
      forecast,
    };
  }

  async getUserImpact(userId: string) {
    const [location, activeRisks, family] = await Promise.all([
      this.prisma.userLocationSnapshot.findUnique({ where: { userId } }),
      this.prisma.riskRegionSnapshot.findMany({
        where: {
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        },
      }),
      this.prisma.familyMember.findMany({
        where: { userId },
        include: {
          family: {
            include: {
              members: {
                include: {
                  user: {
                    include: {
                      locationSnapshot: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!location) {
      return {
        userId,
        impacted: false,
        impacts: [],
        family: [],
      };
    }

    const impacts = activeRisks.filter((risk) => {
      if (risk.latitude == null || risk.longitude == null || risk.radiusKm == null) {
        return false;
      }

      return withinRadiusKm({
        fromLat: location.latitude,
        fromLng: location.longitude,
        toLat: risk.latitude,
        toLng: risk.longitude,
        radiusKm: risk.radiusKm,
      });
    });

    const familyImpacts = family.flatMap((membership) =>
      membership.family.members.map((member) => {
        const memberLocation = member.user.locationSnapshot;
        if (!memberLocation) {
          return {
            userId: member.userId,
            impacted: false,
            impacts: [],
          };
        }

        const memberRisk = activeRisks.filter((risk) => {
          if (
            risk.latitude == null ||
            risk.longitude == null ||
            risk.radiusKm == null
          ) {
            return false;
          }

          return withinRadiusKm({
            fromLat: memberLocation.latitude,
            fromLng: memberLocation.longitude,
            toLat: risk.latitude,
            toLng: risk.longitude,
            radiusKm: risk.radiusKm,
          });
        });

        return {
          userId: member.userId,
          impacted: memberRisk.length > 0,
          impacts: memberRisk,
        };
      }),
    );

    return {
      userId,
      impacted: impacts.length > 0,
      impacts,
      family: familyImpacts,
    };
  }

  async getVulnerableRegions() {
    return this.prisma.riskRegionSnapshot.findMany({
      orderBy: [{ severity: 'desc' }, { startsAt: 'desc' }],
      take: 100,
    });
  }

  async getFullDetail(iso3: string, bbox: string) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);

    const result = await this.prisma.$queryRawUnsafe<
      { id: string; iso3: string; properties: any; geojson: string }[]
    >(
      `
      SELECT 
        id, 
        iso3, 
        properties, 
        ST_AsGeoJSON(geom) AS geojson
      FROM building_profiles
      WHERE iso3 = $1
      AND ST_Intersects(geom, ST_MakeEnvelope($2, $3, $4, $5, 4326))
      LIMIT 5000
    `,
      iso3,
      minLng,
      minLat,
      maxLng,
      maxLat,
    );

    return {
      type: 'FeatureCollection',
      features: result.map((row) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geojson),
        properties: {
          id: row.id,
          iso3: row.iso3,
          data: row.properties,
        },
      })),
    };
  }

}
