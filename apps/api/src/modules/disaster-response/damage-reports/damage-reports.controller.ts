import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { DamageReportsService } from './damage-reports.service';

const DAMAGE_CATEGORIES = [
  'FLOODED_ROAD',
  'COLLAPSED_STRUCTURE',
  'DAMAGED_INFRASTRUCTURE',
] as const;

type DamageCategory = (typeof DAMAGE_CATEGORIES)[number];

class ReporterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

class DamageReportDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: DAMAGE_CATEGORIES, isArray: true })
  damageCategories!: DamageCategory[];

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiProperty()
  photoUrl!: string;

  @ApiProperty()
  confidenceScore!: number;

  @ApiProperty()
  confidenceThreshold!: number;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  reviewStatus!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: ReporterDto })
  reporter!: ReporterDto;
}

class ReviewedByDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

class DamageReportDetailDto extends DamageReportDto {
  @ApiPropertyOptional()
  reviewNote?: string;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional({ type: ReviewedByDto, nullable: true })
  reviewedBy?: ReviewedByDto | null;
}

class CreateDamageReportDto {
  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: Number })
  latitude!: number | string;

  @ApiProperty({ type: Number })
  longitude!: number | string;

  @ApiPropertyOptional({ enum: DAMAGE_CATEGORIES, isArray: true })
  damageCategories?: DamageCategory[];

  @ApiProperty({ type: 'string', format: 'binary' })
  photo!: unknown;
}

function parseNumber(value: unknown, fieldName: string, min: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException(
      `${fieldName} must be a number between ${min} and ${max}.`,
    );
  }

  return parsed;
}

function parseDamageCategories(value: unknown): DamageCategory[] | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  let parsedValues: string[];

  if (Array.isArray(value)) {
    parsedValues = value.map((item) => String(item));
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        throw new BadRequestException('damageCategories must be an array.');
      }
      parsedValues = parsed.map((item) => String(item));
    } else {
      parsedValues = trimmed.split(',').map((item) => item.trim());
    }
  } else {
    throw new BadRequestException('damageCategories must be an array or comma-separated string.');
  }

  const invalid = parsedValues.filter(
    (item) => !DAMAGE_CATEGORIES.includes(item as DamageCategory),
  );

  if (invalid.length > 0) {
    throw new BadRequestException(
      `damageCategories must be one of: ${DAMAGE_CATEGORIES.join(', ')}.`,
    );
  }

  return Array.from(new Set(parsedValues)) as DamageCategory[];
}

function assertCreateDamageReportDto(input: CreateDamageReportDto): {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  damageCategories?: DamageCategory[];
} {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  const title = input.title?.trim();
  if (!title) {
    throw new BadRequestException('title is required.');
  }

  const description = input.description?.trim() || undefined;
  const latitude = parseNumber(input.latitude, 'latitude', -90, 90);
  const longitude = parseNumber(input.longitude, 'longitude', -180, 180);
  const damageCategories = parseDamageCategories(input.damageCategories);

  return {
    title,
    description,
    latitude,
    longitude,
    damageCategories,
  };
}

@ApiTags('damage-reports')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard)
@Controller('damage-reports')
export class DamageReportsController {
  constructor(private readonly damageReportsService: DamageReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a geo-tagged damage report with photo and mocked AI analysis' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateDamageReportDto })
  @ApiCreatedResponse({ type: DamageReportDto })
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreateDamageReportDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new FileTypeValidator({ fileType: /^image\// })],
      }),
    )
    photo: Express.Multer.File,
  ) {
    const input = assertCreateDamageReportDto(body);

    return this.damageReportsService.createDamageReport(
      session.user.id,
      {
        title: input.title,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        reportedCategories: input.damageCategories,
      },
      photo,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List visible damage reports (approved + own submissions)' })
  @ApiOkResponse({ type: [DamageReportDto] })
  async findVisible(@AuthSessionParam() session: AuthSession) {
    return this.damageReportsService.getVisibleDamageReports(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one damage report with reporter and review details' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: DamageReportDetailDto })
  async findOne(
    @AuthSessionParam() session: AuthSession,
    @Param('id') id: string,
  ) {
    return this.damageReportsService.getDamageReportById(session.user.id, id);
  }
}