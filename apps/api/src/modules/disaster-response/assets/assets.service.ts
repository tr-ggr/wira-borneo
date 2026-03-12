import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../core/database/database.service';
import { SupabaseService } from '../../../providers/supabase/supabase.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async createAsset(
    userId: string,
    input: {
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    },
    photo?: Express.Multer.File,
  ) {
    let photoUrl: string | undefined;

    if (photo) {
      const sanitizedFileName = photo.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `assets/${randomUUID()}-${sanitizedFileName}`;

      photoUrl = await this.supabaseService.uploadFile(filePath, photo.buffer, {
        contentType: photo.mimetype,
      });
    }

    return this.prisma.asset.create({
      data: {
        ...input,
        photoUrl,
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
