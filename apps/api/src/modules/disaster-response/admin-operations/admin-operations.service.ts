import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { RiskIntelligenceService } from '../risk-intelligence/risk-intelligence.service';
import { OpenMeteoService } from '../../../providers/open-meteo/open-meteo.service';
import {
  OpenMeteoForecastParams,
  OpenMeteoGeocodingParams,
} from '../../../providers/open-meteo/open-meteo.types';
import { AssistantService } from '../assistant/assistant.service';

@Injectable()
export class AdminOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: RiskIntelligenceService,
    private readonly openMeteoService: OpenMeteoService,
    private readonly assistantService: AssistantService,
  ) { }

  async listVolunteerApplications(options: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.prisma.volunteerApplication.findMany({
      where: {
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ [options.sortBy ?? 'createdAt']: options.sortOrder ?? 'desc' }],
    });
  }

  async reviewVolunteerApplication(input: {
    applicationId: string;
    reviewerId: string;
    nextStatus: 'APPROVED' | 'REJECTED';
    reason?: string;
  }) {
    if (input.nextStatus === 'REJECTED' && !input.reason) {
      throw new BadRequestException('A reason is required when rejecting an application.');
    }

    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id: input.applicationId },
    });

    if (!application) {
      throw new BadRequestException('Volunteer application does not exist.');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException(
        'Volunteer application already has a final decision.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.volunteerApplication.update({
        where: { id: input.applicationId },
        data: {
          status: input.nextStatus,
          reviewedById: input.reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.volunteerProfile.update({
        where: { userId: application.userId },
        data: {
          status: input.nextStatus,
          approvedById: input.nextStatus === 'APPROVED' ? input.reviewerId : null,
          approvedAt: input.nextStatus === 'APPROVED' ? new Date() : null,
        },
      });

      await tx.volunteerDecisionLog.create({
        data: {
          volunteerApplicationId: input.applicationId,
          actorId: input.reviewerId,
          previousStatus: application.status,
          nextStatus: input.nextStatus,
          reason: input.reason,
        },
      });

      return updated;
    });
  }

  async bulkReviewVolunteerApplications(input: {
    applicationIds: string[];
    reviewerId: string;
    nextStatus: 'APPROVED' | 'REJECTED';
    reason?: string;
  }) {
    if (input.nextStatus === 'REJECTED' && !input.reason) {
      throw new BadRequestException('A reason is required when rejecting applications.');
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const id of input.applicationIds) {
        const application = await tx.volunteerApplication.findUnique({
          where: { id },
        });

        if (!application || application.status !== 'PENDING') {
          continue;
        }

        const updated = await tx.volunteerApplication.update({
          where: { id },
          data: {
            status: input.nextStatus,
            reviewedById: input.reviewerId,
            reviewedAt: new Date(),
          },
        });

        await tx.volunteerProfile.update({
          where: { userId: application.userId },
          data: {
            status: input.nextStatus,
            approvedById: input.nextStatus === 'APPROVED' ? input.reviewerId : null,
            approvedAt: input.nextStatus === 'APPROVED' ? new Date() : null,
          },
        });

        await tx.volunteerDecisionLog.create({
          data: {
            volunteerApplicationId: id,
            actorId: input.reviewerId,
            previousStatus: application.status,
            nextStatus: input.nextStatus,
            reason: input.reason,
          },
        });

        results.push(updated);
      }
      return results;
    });
  }

  async suspendVolunteer(userId: string, actorId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.volunteerProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new BadRequestException('Volunteer profile not found.');
      }

      const updated = await tx.volunteerProfile.update({
        where: { userId },
        data: { status: 'SUSPENDED' },
      });

      // Update the latest application status as well to keep the UI in sync
      await tx.volunteerApplication.updateMany({
        where: { userId, status: { not: 'REJECTED' } },
        data: { status: 'SUSPENDED' },
      });

      // Find the latest application to log against
      const latestApp = await tx.volunteerApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (latestApp) {
        await tx.volunteerDecisionLog.create({
          data: {
            volunteerApplicationId: latestApp.id,
            actorId,
            previousStatus: profile.status,
            nextStatus: 'SUSPENDED',
            reason: reason || 'Volunteer suspended by admin.',
          },
        });
      }

      return updated;
    });
  }

  async reactivateVolunteer(userId: string, actorId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.volunteerProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new BadRequestException('Volunteer profile not found.');
      }

      const updated = await tx.volunteerProfile.update({
        where: { userId },
        data: { status: 'APPROVED' },
      });

      // Update application status back to APPROVED
      await tx.volunteerApplication.updateMany({
        where: { userId, status: 'SUSPENDED' },
        data: { status: 'APPROVED' },
      });

      const latestApp = await tx.volunteerApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (latestApp) {
        await tx.volunteerDecisionLog.create({
          data: {
            volunteerApplicationId: latestApp.id,
            actorId,
            previousStatus: profile.status,
            nextStatus: 'APPROVED',
            reason: reason || 'Volunteer reactivated by admin.',
          },
        });
      }

      return updated;
    });
  }

  async getAssetRegistry() {
    const assets = await this.prisma.asset.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            volunteerProfile: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      photoUrl: a.photoUrl,
      latitude: a.latitude,
      longitude: a.longitude,
      ownerId: a.user.id,
      ownerName: a.user.name,
      ownerEmail: a.user.email,
      ownerCreatedAt: a.user.createdAt,
      volunteerStatus: a.user.volunteerProfile?.status ?? null,
      createdAt: a.createdAt,
    }));
  }

  async reviewAsset(input: {
    assetId: string;
    reviewerId: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
  }) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found.');
    }

    const nextStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    return this.prisma.asset.update({
      where: { id: input.assetId },
      data: {
        status: nextStatus,
      },
    });
  }

  async getApplicationHistory(applicationId: string) {
    return this.prisma.volunteerDecisionLog.findMany({
      where: { volunteerApplicationId: applicationId },
      include: {
        actor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWarning(input: {
    title: string;
    message: string;
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    startsAt: Date;
    endsAt?: Date;
    suggestedPrompt?: string;
    creatorId: string;
    targets: Array<{
      areaName: string;
      latitude?: number;
      longitude?: number;
      radiusKm?: number;
      polygonGeoJson?: string;
    }>;
    evacuationAreaIds: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const warning = await tx.warningEvent.create({
        data: {
          title: input.title,
          message: input.message,
          hazardType: input.hazardType,
          severity: input.severity,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          suggestedPrompt: input.suggestedPrompt,
          createdById: input.creatorId,
          status: 'SENT',
          isManualDispatch: true,
          targetAreas: {
            create: input.targets,
          },
          evacuationAreas: {
            create: input.evacuationAreaIds.map((evacuationAreaId) => ({
              evacuationAreaId,
            })),
          },
        },
        include: {
          targetAreas: true,
          evacuationAreas: true,
        },
      });

      await tx.warningEventLog.create({
        data: {
          warningEventId: warning.id,
          actorId: input.creatorId,
          action: 'CREATE',
          status: 'SENT',
          note: 'Warning sent manually by admin.',
        },
      });

      return warning;
    });
  }

  async listWarnings(options?: {
    status?: 'DRAFT' | 'SENT' | 'CANCELLED';
  }) {
    return this.prisma.warningEvent.findMany({
      where: {
        ...(options?.status ? { status: options.status } : {}),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        targetAreas: {
          select: {
            id: true,
            areaName: true,
            latitude: true,
            longitude: true,
            radiusKm: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWarning(input: {
    warningId: string;
    title?: string;
    message?: string;
    hazardType?: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    startsAt?: Date;
    endsAt?: Date;
    actorId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const warning = await tx.warningEvent.findUnique({
        where: { id: input.warningId },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      const updated = await tx.warningEvent.update({
        where: { id: input.warningId },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.message && { message: input.message }),
          ...(input.hazardType && { hazardType: input.hazardType }),
          ...(input.severity && { severity: input.severity }),
          ...(input.startsAt && { startsAt: input.startsAt }),
          ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
        },
      });

      await tx.warningEventLog.create({
        data: {
          warningEventId: warning.id,
          actorId: input.actorId,
          action: 'UPDATE',
          status: updated.status,
          note: 'Warning updated manually by admin.',
        },
      });

      return updated;
    });
  }

  async cancelWarning(warningId: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const warning = await tx.warningEvent.findUnique({
        where: { id: warningId },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      if (warning.status === 'CANCELLED') {
        throw new BadRequestException('Warning is already cancelled');
      }

      const updated = await tx.warningEvent.update({
        where: { id: warningId },
        data: {
          status: 'CANCELLED',
        },
      });

      await tx.warningEventLog.create({
        data: {
          warningEventId: warning.id,
          actorId,
          action: 'CANCEL',
          status: 'CANCELLED',
          note: 'Warning cancelled manually by admin.',
        },
      });

      return updated;
    });
  }

  async deleteWarning(warningId: string) {
    const existing = await this.prisma.warningEvent.findUnique({
      where: { id: warningId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Warning not found');
    }

    return this.prisma.warningEvent.delete({
      where: { id: warningId },
    });
  }

  async getVulnerableRegions() {
    return this.riskService.getVulnerableRegions();
  }

  async getPinStatuses() {
    return this.prisma.mapPinStatus.findMany({
      include: {
        reporter: { select: { name: true } },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getDamageReports() {
    return this.prisma.damageReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ reviewStatus: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async reviewPin(input: {
    pinId: string;
    reviewerId: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
  }) {
    const pin = await this.prisma.mapPinStatus.findUnique({
      where: { id: input.pinId },
    });

    if (!pin) {
      throw new NotFoundException('Pin not found.');
    }

    const reviewStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const status = input.action === 'APPROVE' ? 'RESOLVED' : pin.status;

    return this.prisma.mapPinStatus.update({
      where: { id: input.pinId },
      data: {
        reviewedById: input.reviewerId,
        reviewedAt: new Date(),
        reviewNote: input.reason ?? undefined,
        reviewStatus,
        status,
      },
    });
  }

  async reviewDamageReport(input: {
    damageReportId: string;
    reviewerId: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
  }) {
    const report = await this.prisma.damageReport.findUnique({
      where: { id: input.damageReportId },
    });

    if (!report) {
      throw new NotFoundException('Damage report not found.');
    }

    const reviewStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    return this.prisma.damageReport.update({
      where: { id: input.damageReportId },
      data: {
        reviewedById: input.reviewerId,
        reviewedAt: new Date(),
        reviewNote: input.reason ?? undefined,
        reviewStatus,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getWarningPromptSuggestion(input: {
    hazardType: string;
    areaOrRegion: string;
    radiusKm?: number;
  }) {
    const radius = input.radiusKm ? ` within ${input.radiusKm}km` : '';
    const question = `Generate a localized emergency notification message for a ${input.hazardType.toLowerCase()} warning targeting ${input.areaOrRegion}${radius}. Write the notification in the local language or dialect appropriate for this region. Include nearest evacuation guidance, expected impact, and immediate safety actions. Return only the notification text, no JSON wrapping.`;

    const assistantResponse = await this.assistantService.answerInquiry({
      userId: 'system-admin',
      question,
      location: input.areaOrRegion,
      hazardType: input.hazardType,
    });

    return {
      prompt: assistantResponse.answer,
      reminder:
        'Review and send manually to avoid false alarms. Warning dispatch is never automatic.',
    };
  }

  async getUserLocations() {
    return this.prisma.userLocationSnapshot.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getHelpRequests() {
    return this.prisma.helpRequest.findMany({
      where: {
        status: { in: ['OPEN', 'CLAIMED', 'IN_PROGRESS'] },
      },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMapOverview() {
    const [vulnerableRegions, pinStatuses, damageReports, userLocations, helpRequests] = await Promise.all([
      this.getVulnerableRegions(),
      this.getPinStatuses(),
      this.getDamageReports(),
      this.getUserLocations(),
      this.getHelpRequests(),
    ]);

    return {
      vulnerableRegions,
      pinStatuses,
      damageReports,
      userLocations,
      helpRequests,
    };
  }

  async getWeatherForecast(params: OpenMeteoForecastParams) {
    return this.openMeteoService.getForecast(params);
  }

  async getWeatherGeocoding(params: OpenMeteoGeocodingParams) {
    return this.openMeteoService.getGeocoding(params);
  }
}
