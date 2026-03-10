import { Injectable, NotFoundException, OnModuleInit, Logger, StreamableFile } from '@nestjs/common';
import { join } from 'path';
import { access } from 'fs/promises';
import { constants, createReadStream } from 'fs';
import { OpenMeteoService } from '../../../providers/open-meteo/open-meteo.service';
import { PrismaService } from '../../../core/database/database.service';
import { withinRadiusKm } from '../shared/geo.util';

@Injectable()
export class RiskIntelligenceService implements OnModuleInit {
  private readonly logger = new Logger(RiskIntelligenceService.name);

  constructor(
    private readonly openMeteoService: OpenMeteoService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const requiredIso3Codes = ['brn', 'idn', 'mys', 'phl', 'sgp'];
    const missingFiles: string[] = [];

    for (const iso3 of requiredIso3Codes) {
      const filename = `vulnerability_${iso3}.geojson`;
      const filePath = join(
        process.cwd(),
        'apps/api/geojson/building_profiles',
        filename,
      );

      try {
        await access(filePath, constants.R_OK);
      } catch {
        missingFiles.push(filename);
      }
    }

    if (missingFiles.length > 0) {
      this.logger.warn(
        `Missing GeoJSON building profiles: ${missingFiles.join(', ')}. ` +
          'Vulnerable-regions features may be limited. Add files to apps/api/geojson/building_profiles/',
      );
    } else {
      this.logger.log('GeoJSON building profiles validated successfully.');
    }
  }

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

  async getBuildingProfileGeoJson(latitude: number, longitude: number) {
    const countryCode = await this.getCountryCode(latitude, longitude);
    if (!countryCode) {
      throw new NotFoundException('Could not determine country for the given coordinates');
    }

    const countryMap: Record<string, string> = {
      bn: 'brn',
      id: 'idn',
      my: 'mys',
      ph: 'phl',
      sg: 'sgp',
    };

    const iso3Code = countryMap[countryCode.toLowerCase()];
    if (!iso3Code) {
      throw new NotFoundException(
        `Building profiles are not available for country code: ${countryCode}`,
      );
    }

    const filename = `vulnerability_${iso3Code}.geojson`;
    const filePath = join(
      process.cwd(),
      'apps/api/geojson/building_profiles',
      filename,
    );

    try {
      await access(filePath, constants.R_OK);
      const file = createReadStream(filePath);
      return new StreamableFile(file);
    } catch (error) {
      this.logger.error(`Building profile read failed for ${filePath}:`, error);
      throw new NotFoundException(` ${iso3Code.toUpperCase()} not found`);
    }
  }

  async getMvtTile(z: number, x: number, y: number): Promise<Buffer> {
    const query = `
      WITH 
      bounds AS (
        SELECT ST_TileEnvelope($1, $2, $3) AS geom
      ),
      mvtgeom AS (
        SELECT 
          ST_AsMVTGeom(
            ST_Transform(bp.geom, 3857),
            bounds.geom,
            4096, 
            64, 
            true
          ) AS geom,
          bp.properties
        FROM building_profiles bp, bounds
        WHERE ST_Intersects(ST_Transform(bp.geom, 3857), bounds.geom)
      )
      SELECT ST_AsMVT(mvtgeom.*, 'building-profiles') AS mvt FROM mvtgeom;
    `;

    const result = await this.prisma.$queryRawUnsafe<{ mvt: Buffer }[]>(query, z, x, y);

    if (!result || result.length === 0 || !result[0].mvt) {
      return Buffer.alloc(0);
    }

    return result[0].mvt;
  }

  private async getCountryCode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=3`,
        {
          headers: {
            'User-Agent': 'WiraBorneoRiskIntelligence/1.0',
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Nominatim API returned ${response.status} ${await response.text()}`);
        return null;
      }

      const data = (await response.json()) as { address?: { country_code?: string } };
      return data.address?.country_code || null;
    } catch (error) {
      this.logger.error('Failed to get country code:', error);
      return null;
    }
  }
}
