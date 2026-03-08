import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { RiskIntelligenceService } from '../risk-intelligence/risk-intelligence.service';

@Injectable()
export class AdminOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: RiskIntelligenceService,
  ) {}

  async listVolunteerApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.volunteerApplication.findMany({
      where: {
        ...(status ? { status } : {}),
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
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async reviewVolunteerApplication(input: {
    applicationId: string;
    reviewerId: string;
    nextStatus: 'APPROVED' | 'REJECTED';
    reason?: string;
  }) {
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

      await tx.volunteerProfile.upsert({
        where: { userId: application.userId },
        update: {
          status: input.nextStatus,
          approvedById:
            input.nextStatus === 'APPROVED' ? input.reviewerId : null,
          approvedAt: input.nextStatus === 'APPROVED' ? new Date() : null,
        },
        create: {
          userId: application.userId,
          status: input.nextStatus,
          approvedById:
            input.nextStatus === 'APPROVED' ? input.reviewerId : null,
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
          status: 'SENT',
          note: 'Warning sent manually by admin.',
        },
      });

      return warning;
    });
  }

  async getVulnerableRegions() {
    return this.riskService.getVulnerableRegions();
  }

  async getPinStatuses() {
    return this.prisma.mapPinStatus.findMany({
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  getWarningPromptSuggestion(input: {
    hazardType: string;
    areaOrRegion: string;
    radiusKm?: number;
  }) {
    const radius = input.radiusKm ? ` within ${input.radiusKm}km` : '';

    return {
      prompt: `Issue a ${input.hazardType.toLowerCase()} warning for ${input.areaOrRegion}${radius}. Include nearest evacuation areas, expected impact window, and immediate safety actions.`,
      reminder:
        'Review and send manually to avoid false alarms. Warning dispatch is never automatic.',
    };
  }
}
