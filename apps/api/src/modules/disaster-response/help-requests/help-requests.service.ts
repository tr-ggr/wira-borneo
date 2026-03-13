import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { HelpRequestTriageService } from './help-request-triage.service';

const SOS_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SOS_TRIAGE_TEXT = [
  'Hazard Type: FLOOD',
  'Description: SOS emergency request submitted via one-tap trigger.',
  'User Context: Immediate assistance needed. Location attached from live device coordinates.',
].join('\n');

@Injectable()
export class HelpRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triageService: HelpRequestTriageService,
  ) {}

  async create(input: {
    requesterId: string;
    familyId?: string;
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    latitude: number;
    longitude: number;
    sosExpiresAt?: Date;
  }) {
    const triageText = input.sosExpiresAt ? SOS_TRIAGE_TEXT : this.buildTriageText(input);
    const triage = await this.triageService.triage(triageText);

    return this.prisma.helpRequest.create({
      data: {
        requesterId: input.requesterId,
        familyId: input.familyId,
        hazardType: input.hazardType,
        urgency: input.urgency,
        predictedUrgency: triage?.predictedUrgency ?? null,
        urgencyConfidence: triage?.urgencyConfidence ?? null,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        ...(input.sosExpiresAt != null && { sosExpiresAt: input.sosExpiresAt }),
      },
    });
  }

  private buildTriageText(input: {
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    description: string;
  }): string {
    return [
      `Hazard Type: ${input.hazardType}`,
      `Description: ${input.description.trim() || 'N/A'}`,
    ].join('\n');
  }

  async listMine(userId: string) {
    return this.prisma.helpRequest.findMany({
      where: { requesterId: userId },
      include: {
        assignments: true,
        events: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllOpen(excludeUserId?: string) {
    const now = new Date();
    return this.prisma.helpRequest.findMany({
      where: {
        status: 'OPEN',
        ...(excludeUserId ? { requesterId: { not: excludeUserId } } : {}),
        OR: [
          { sosExpiresAt: null },
          { sosExpiresAt: { gt: now } },
        ],
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

  async listAssignments(volunteerId: string) {
    return this.prisma.helpAssignment.findMany({
      where: { volunteerId },
      include: {
        helpRequest: {
          include: {
            requester: {
              select: {
                name: true,
              },
            },
            events: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async claim(helpRequestId: string, volunteerId: string) {
    const request = await this.prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
    });

    if (!request) {
      throw new NotFoundException('Help request not found.');
    }

    if (request.status !== 'OPEN') {
      throw new BadRequestException('Help request is not open for claiming.');
    }

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.helpAssignment.create({
        data: {
          helpRequestId,
          volunteerId,
          status: 'CLAIMED',
        },
      });

      await tx.helpRequest.update({
        where: { id: helpRequestId },
        data: { status: 'CLAIMED' },
      });

      await tx.helpRequestEvent.create({
        data: {
          helpRequestId,
          actorId: volunteerId,
          previousStatus: request.status,
          nextStatus: 'CLAIMED',
          note: 'Help request claimed by volunteer.',
        },
      });

      return assignment;
    });
  }

  async updateAssignmentStatus(input: {
    helpRequestId: string;
    volunteerId: string;
    nextStatus: 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  }) {
    const assignment = await this.prisma.helpAssignment.findFirst({
      where: {
        helpRequestId: input.helpRequestId,
        volunteerId: input.volunteerId,
      },
      orderBy: { assignedAt: 'desc' },
    });

    if (!assignment) {
      throw new NotFoundException('No assignment found for this volunteer.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.helpAssignment.update({
        where: { id: assignment.id },
        data: {
          status:
            input.nextStatus === 'IN_PROGRESS'
              ? 'ON_SITE'
              : input.nextStatus === 'RESOLVED'
                ? 'COMPLETED'
                : 'CANCELLED',
        },
      });

      const request = await tx.helpRequest.update({
        where: { id: input.helpRequestId },
        data: { status: input.nextStatus },
      });

      await tx.helpRequestEvent.create({
        data: {
          helpRequestId: input.helpRequestId,
          actorId: input.volunteerId,
          previousStatus: request.status,
          nextStatus: input.nextStatus,
          note: 'Help request status updated by assigned volunteer.',
        },
      });

      return request;
    });
  }
}
