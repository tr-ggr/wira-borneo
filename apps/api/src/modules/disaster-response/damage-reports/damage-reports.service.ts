import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../core/database/database.service';
import { SupabaseService } from '../../../providers/supabase/supabase.service';
import { DamageAnalysisService, type DamageCategory } from './damage-analysis.service';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

function getConfidenceThreshold(): number {
  const configured = Number(process.env.DAMAGE_REPORT_CONFIDENCE_THRESHOLD);

  if (!Number.isFinite(configured)) {
    return DEFAULT_CONFIDENCE_THRESHOLD;
  }

  return Math.min(1, Math.max(0, configured));
}

function mergeCategories(
  reportedCategories: DamageCategory[] | undefined,
  detectedCategories: DamageCategory[],
): DamageCategory[] {
  return Array.from(new Set([...(reportedCategories ?? []), ...detectedCategories]));
}

@Injectable()
export class DamageReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly damageAnalysisService: DamageAnalysisService,
  ) {}

  async createDamageReport(
    reporterId: string,
    input: {
      title: string;
      description?: string;
      latitude: number;
      longitude: number;
      reportedCategories?: DamageCategory[];
    },
    photo: Express.Multer.File,
  ) {
    const sanitizedFileName = photo.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const photoKey = `damage-reports/${randomUUID()}-${sanitizedFileName}`;
    const photoUrl = await this.supabaseService.uploadFile(photoKey, photo.buffer, {
      contentType: photo.mimetype,
    });

    const analysis = await this.damageAnalysisService.analyzeImage(photoUrl);
    const confidenceThreshold = getConfidenceThreshold();
    const damageCategories = mergeCategories(
      input.reportedCategories,
      analysis.damageCategories,
    );
    const reviewStatus =
      analysis.confidenceScore >= confidenceThreshold ? 'APPROVED' : 'PENDING';

    return this.prisma.damageReport.create({
      data: {
        reporterId,
        title: input.title,
        description: input.description,
        damageCategories,
        latitude: input.latitude,
        longitude: input.longitude,
        photoUrl,
        photoKey,
        confidenceScore: analysis.confidenceScore,
        confidenceThreshold,
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
      },
    });
  }

  async getVisibleDamageReports(userId: string) {
    return this.prisma.damageReport.findMany({
      where: {
        OR: [{ reviewStatus: 'APPROVED' }, { reporterId: userId }],
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDamageReportById(userId: string, id: string) {
    const report = await this.prisma.damageReport.findUnique({
      where: { id },
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

    if (!report) {
      throw new NotFoundException('Damage report not found.');
    }

    if (report.reviewStatus !== 'APPROVED' && report.reporterId !== userId) {
      throw new ForbiddenException('You do not have access to this damage report.');
    }

    return report;
  }
}