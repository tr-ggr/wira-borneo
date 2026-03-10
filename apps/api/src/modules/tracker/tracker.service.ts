import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/database.service';

@Injectable()
export class TrackerService {
  constructor(private readonly prisma: PrismaService) {}

  async getShipments(status?: string) {
    const where = status ? { status: status.toUpperCase() } : {};
    return this.prisma.trackerShipment.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async getShipmentById(id: string) {
    return this.prisma.trackerShipment.findUnique({
      where: { id },
    });
  }

  async getStats() {
    const stats = await this.prisma.trackerStats.findFirst({
      orderBy: { lastUpdated: 'desc' },
    });
    return (
      stats || {
        totalAidDisbursed: 0,
        verifiedPayouts: 0,
        networkTrustIndex: 99.98,
      }
    );
  }

  async getReliefZones() {
    return this.prisma.trackerReliefZone.findMany({
      where: { status: 'ACTIVE' },
    });
  }

  async getValidators() {
    return this.prisma.trackerValidator.findMany({
      where: { status: { in: ['ONLINE', 'DEGRADED'] } },
      orderBy: { uptimePercentage: 'desc' },
    });
  }

  async getDonationDistribution() {
    // Calculate distribution from shipments
    const shipments = await this.prisma.trackerShipment.findMany({
      where: { verificationStatus: 'VERIFIED' },
    });

    const distribution: Record<string, number> = {};
    const total = shipments.length;

    shipments.forEach((s) => {
      distribution[s.class] = (distribution[s.class] || 0) + 1;
    });

    // Convert to percentages
    const result: Record<string, number> = {};
    Object.entries(distribution).forEach(([key, count]) => {
      result[key] = Math.round((count / total) * 100);
    });

    return result;
  }
}
