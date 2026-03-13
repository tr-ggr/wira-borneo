import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';
import { PinTriageService } from './pin-triage.service';

const AUTO_APPROVAL_THRESHOLD = 0.85;

function mapUrgencyToPriority(urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
  switch (urgency) {
    case 'LOW':
      return 1;
    case 'MEDIUM':
      return 2;
    case 'HIGH':
      return 3;
    case 'CRITICAL':
      return 4;
  }
}

@Injectable()
export class PinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pinTriageService: PinTriageService,
  ) {}

  async create(input: {
    reporterId: string;
    title: string;
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    latitude: number;
    longitude: number;
    note?: string;
    photoUrl?: string;
    photoKey?: string;
  }) {
    const triage = await this.pinTriageService.triage({
      hazardType: input.hazardType,
      title: input.title,
      note: input.note,
    });

    const reviewStatus =
      triage && triage.urgencyConfidence >= AUTO_APPROVAL_THRESHOLD ? 'APPROVED' : 'PENDING';
    const priority = triage ? mapUrgencyToPriority(triage.predictedUrgency) : 1;
    const reviewNote = triage
      ? `[AUTO_TRIAGE] ${JSON.stringify({
          predicted_urgency: triage.predictedUrgency,
          urgency_confidence: triage.urgencyConfidence,
          summary: triage.summary,
        })}`
      : undefined;

    return this.prisma.mapPinStatus.create({
      data: {
        reporterId: input.reporterId,
        title: input.title,
        hazardType: input.hazardType,
        latitude: input.latitude,
        longitude: input.longitude,
        note: input.note ?? undefined,
        photoUrl: input.photoUrl ?? undefined,
        photoKey: input.photoKey ?? undefined,
        status: 'OPEN',
        reviewStatus,
        reviewNote,
        priority,
      },
    });
  }

  /** Pins visible to the given user: all approved + user's own (any status). Deduped by id. */
  async getVisiblePins(userId: string): Promise<
    Array<{
      id: string;
      latitude: number;
      longitude: number;
      title: string;
      hazardType: string;
      reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
      reporterId: string | null;
    }>
  > {
    const [approved, mine] = await Promise.all([
      this.prisma.mapPinStatus.findMany({
        where: { reviewStatus: 'APPROVED' },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          title: true,
          hazardType: true,
          reviewStatus: true,
          reporterId: true,
        },
      }),
      this.prisma.mapPinStatus.findMany({
        where: { reporterId: userId },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          title: true,
          hazardType: true,
          reviewStatus: true,
          reporterId: true,
        },
      }),
    ]);

    const byId = new Map(
      [...approved, ...mine].map((p) => [
        p.id,
        {
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.title,
          hazardType: p.hazardType,
          reviewStatus: p.reviewStatus,
          reporterId: p.reporterId,
        },
      ]),
    );
    return Array.from(byId.values());
  }
}
