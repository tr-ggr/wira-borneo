import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(userId: string, input: {
    name: string;
    description?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.prisma.asset.create({
      data: {
        ...input,
        userId,
        status: 'PENDING',
      },
    });
  }

  async listMyAssets(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listApprovedAssets() {
    return this.prisma.asset.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async deleteAsset(userId: string, id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.userId !== userId) {
      throw new ForbiddenException('You do not own this asset');
    }
    return this.prisma.asset.delete({
      where: { id },
    });
  }
}
