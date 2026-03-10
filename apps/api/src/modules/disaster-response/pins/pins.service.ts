import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';

@Injectable()
export class PinsService {
  constructor(private readonly prisma: PrismaService) {}

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
        reviewStatus: 'PENDING',
      },
    });
  }
}
