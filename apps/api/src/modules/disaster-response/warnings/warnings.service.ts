import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { withinRadiusKm, isInsideGeoJsonPolygon } from '../shared/geo.util';

@Injectable()
export class WarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWarnings(userId: string) {
    const location = await this.prisma.userLocationSnapshot.findUnique({
      where: { userId },
    });

    const warnings = await this.prisma.warningEvent.findMany({
      where: {
        status: 'SENT',
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
      include: {
        targetAreas: true,
        evacuationAreas: {
          include: {
            evacuationArea: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!location) {
      return [];
    }

    return warnings.filter((warning) =>
      warning.targetAreas.some((area) => {
        // Check polygon-based targeting first
        if (area.polygonGeoJson) {
          return isInsideGeoJsonPolygon(
            location.latitude,
            location.longitude,
            area.polygonGeoJson,
          );
        }

        // Fall back to radius-based targeting
        if (area.latitude != null && area.longitude != null && area.radiusKm != null) {
          return withinRadiusKm({
            fromLat: location.latitude,
            fromLng: location.longitude,
            toLat: area.latitude,
            toLng: area.longitude,
            radiusKm: area.radiusKm,
          });
        }

        // If neither polygon nor radius is specified, treat as broadcast (return true)
        return true;
      }),
    );
  }

  async getFamilyWarnings(userId: string) {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      select: { familyId: true },
    });

    if (memberships.length === 0) {
      return [];
    }

    const familyMembers = await this.prisma.familyMember.findMany({
      where: {
        familyId: { in: memberships.map((item) => item.familyId) },
      },
      include: {
        user: {
          include: {
            locationSnapshot: true,
          },
        },
      },
    });

    const warnings = await this.prisma.warningEvent.findMany({
      where: {
        status: 'SENT',
      },
      include: {
        targetAreas: true,
        evacuationAreas: {
          include: {
            evacuationArea: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return warnings.filter((warning) =>
      familyMembers.some((member) => {
        const location = member.user.locationSnapshot;
        if (!location) {
          return false;
        }

        return warning.targetAreas.some((area) => {
          // Check polygon-based targeting first
          if (area.polygonGeoJson) {
            return isInsideGeoJsonPolygon(
              location.latitude,
              location.longitude,
              area.polygonGeoJson,
            );
          }

          // Fall back to radius-based targeting
          if (area.latitude != null && area.longitude != null && area.radiusKm != null) {
            return withinRadiusKm({
              fromLat: location.latitude,
              fromLng: location.longitude,
              toLat: area.latitude,
              toLng: area.longitude,
              radiusKm: area.radiusKm,
            });
          }

          // If neither polygon nor radius is specified, treat as broadcast (return true)
          return true;
        });
      }),
    );
  }
}
