import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import type {
  OpenMeteoForecastDailyVariable,
  OpenMeteoForecastHourlyVariable,
  OpenMeteoModel,
  OpenMeteoPrecipitationUnit,
  OpenMeteoTemperatureUnit,
  OpenMeteoWindSpeedUnit,
} from '../../../providers/open-meteo/open-meteo.types';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { AdminRoleGuard } from '../shared/admin-role.guard';
import { parseDateRange } from '../shared/request-validation';
import { AdminOperationsService } from './admin-operations.service';

class ReviewVolunteerDto {
  nextStatus!: 'APPROVED' | 'REJECTED';
  reason?: string;
}

class BulkReviewVolunteerDto {
  applicationIds!: string[];
  nextStatus!: 'APPROVED' | 'REJECTED';
  reason?: string;
}

class SuspendReactivateVolunteerDto {
  reason?: string;
}

class ReviewAssetDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  action!: 'APPROVE' | 'REJECT';
  @ApiPropertyOptional()
  reason?: string;
}

class WarningTargetDto {
  areaName!: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  polygonGeoJson?: string;
}

class CreateWarningDto {
  title!: string;
  message!: string;
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  severity!: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  startsAt!: string;
  endsAt?: string;
  suggestedPrompt?: string;
  targets!: WarningTargetDto[];
  evacuationAreaIds!: string[];
}

class UpdateWarningDto {
  title?: string;
  message?: string;
  hazardType?: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  startsAt?: string;
  endsAt?: string;
}

class WarningPromptSuggestionDto {
  hazardType!: string;
  areaOrRegion!: string;
  radiusKm?: number;
}

class AdminWeatherForecastDto {
  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiPropertyOptional()
  hourly?: string;

  @ApiPropertyOptional()
  daily?: string;

  @ApiPropertyOptional()
  models?: string;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  current_weather?: boolean;

  @ApiPropertyOptional()
  temperature_unit?: OpenMeteoTemperatureUnit;

  @ApiPropertyOptional()
  wind_speed_unit?: OpenMeteoWindSpeedUnit;

  @ApiPropertyOptional()
  precipitation_unit?: OpenMeteoPrecipitationUnit;

  @ApiPropertyOptional()
  past_days?: 1 | 2;

  @ApiPropertyOptional()
  forecast_days?: number;
}

class AdminWeatherGeocodingDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  count?: number;

  @ApiPropertyOptional()
  language?: string;

  @ApiPropertyOptional()
  countryCode?: string;

  @ApiPropertyOptional()
  format?: 'json' | 'protobuf';
}

class AdminHelpRequestDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  requesterId!: string;
  @ApiProperty()
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  @ApiProperty()
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  @ApiProperty()
  status!: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  @ApiProperty()
  description!: string;
  @ApiProperty()
  latitude!: number;
  @ApiProperty()
  longitude!: number;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty({ type: 'object', properties: { name: { type: 'string' } } })
  requester!: { name: string };
}

class AdminRiskRegionDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  @ApiProperty()
  severity!: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  latitude?: number;
  @ApiPropertyOptional()
  longitude?: number;
  @ApiPropertyOptional()
  radiusKm?: number;
}

class AdminPinStatusDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  @ApiProperty()
  status!: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  @ApiProperty()
  latitude!: number;
  @ApiProperty()
  longitude!: number;
  @ApiPropertyOptional()
  region?: string;
  @ApiPropertyOptional()
  note?: string;
  @ApiPropertyOptional()
  photoUrl?: string;
  @ApiPropertyOptional()
  photoKey?: string;
  @ApiPropertyOptional()
  reportedAt?: Date;
  @ApiPropertyOptional({ type: 'object', properties: { name: { type: 'string' } } })
  reporter?: { name: string };
  @ApiPropertyOptional()
  reviewedById?: string;
  @ApiPropertyOptional()
  reviewedAt?: Date;
  @ApiPropertyOptional()
  reviewNote?: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  @ApiPropertyOptional()
  updatedAt?: Date;
}

class ReviewPinDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  action!: 'APPROVE' | 'REJECT';
  @ApiPropertyOptional()
  reason?: string;
}

class AdminDamageReportDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ['FLOODED_ROAD', 'COLLAPSED_STRUCTURE', 'DAMAGED_INFRASTRUCTURE'], isArray: true })
  damageCategories!: Array<'FLOODED_ROAD' | 'COLLAPSED_STRUCTURE' | 'DAMAGED_INFRASTRUCTURE'>;

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

  @ApiPropertyOptional()
  reviewNote?: string;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } } })
  reporter!: { id: string; name: string; email: string };

  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } },
  })
  reviewedBy?: { id: string; name: string; email: string } | null;
}

class ReviewDamageReportDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  action!: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional()
  reason?: string;
}

class AdminUserLocationDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  userId!: string;
  @ApiProperty()
  latitude!: number;
  @ApiProperty()
  longitude!: number;
  @ApiPropertyOptional()
  region?: string;
  @ApiProperty()
  updatedAt!: Date;
}

class AdminAssetRegistryEntryDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  description?: string;
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  @ApiPropertyOptional()
  photoUrl?: string;
  @ApiPropertyOptional()
  latitude?: number;
  @ApiPropertyOptional()
  longitude?: number;
  @ApiProperty()
  ownerId!: string;
  @ApiProperty()
  ownerName!: string;
  @ApiProperty()
  ownerEmail!: string;
  @ApiProperty()
  ownerCreatedAt!: Date;
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] })
  volunteerStatus!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null;
  @ApiProperty()
  createdAt!: Date;
}

class AdminWarningTargetAreaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  areaName!: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  radiusKm?: number;
}

class AdminWarningListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ enum: ['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] })
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';

  @ApiProperty({ enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] })
  severity!: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ enum: ['DRAFT', 'SENT', 'CANCELLED'] })
  status!: 'DRAFT' | 'SENT' | 'CANCELLED';

  @ApiProperty()
  startsAt!: Date;

  @ApiPropertyOptional()
  endsAt?: Date | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
  })
  createdBy!: { id: string; name: string } | null;

  @ApiProperty({ type: [AdminWarningTargetAreaDto] })
  targetAreas!: AdminWarningTargetAreaDto[];

  @ApiProperty()
  createdAt!: Date;
}

class MapOverviewResponseDto {
  @ApiProperty({ type: AdminRiskRegionDto, isArray: true })
  vulnerableRegions!: AdminRiskRegionDto[];
  @ApiProperty({ type: AdminPinStatusDto, isArray: true })
  pinStatuses!: AdminPinStatusDto[];
  @ApiProperty({ type: AdminDamageReportDto, isArray: true })
  damageReports!: AdminDamageReportDto[];
  @ApiProperty({ type: AdminUserLocationDto, isArray: true })
  userLocations!: AdminUserLocationDto[];
  @ApiProperty({ type: AdminHelpRequestDto, isArray: true })
  helpRequests!: AdminHelpRequestDto[];
}

const VOLUNTEER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
const HAZARD_TYPES = ['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] as const;
const SEVERITY_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;
const WARNING_STATUSES = ['DRAFT', 'SENT', 'CANCELLED'] as const;

function parseVolunteerStatus(value?: string):
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | undefined {
  if (!value) {
    return undefined;
  }

  if (!VOLUNTEER_STATUSES.includes(value as (typeof VOLUNTEER_STATUSES)[number])) {
    throw new BadRequestException(
      `status must be one of: ${VOLUNTEER_STATUSES.join(', ')}.`,
    );
  }

  return value as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

function parseWarningStatus(value?: string): 'DRAFT' | 'SENT' | 'CANCELLED' | undefined {
  if (!value) {
    return undefined;
  }

  if (!WARNING_STATUSES.includes(value as (typeof WARNING_STATUSES)[number])) {
    throw new BadRequestException(
      `status must be one of: ${WARNING_STATUSES.join(', ')}.`,
    );
  }

  return value as 'DRAFT' | 'SENT' | 'CANCELLED';
}

function assertReviewVolunteerDto(input: ReviewVolunteerDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (
    !VOLUNTEER_STATUSES.includes(
      input.nextStatus as (typeof VOLUNTEER_STATUSES)[number],
    ) ||
    (input.nextStatus as string) === 'PENDING'
  ) {
    throw new BadRequestException(
      'nextStatus must be APPROVED or REJECTED.',
    );
  }

  if (input.nextStatus === 'REJECTED' && !input.reason) {
    throw new BadRequestException('reason is required when rejecting.');
  }

  if (input.reason != null && typeof input.reason !== 'string') {
    throw new BadRequestException('reason must be a string.');
  }
}

function assertBulkReviewVolunteerDto(input: BulkReviewVolunteerDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (!Array.isArray(input.applicationIds) || input.applicationIds.length === 0) {
    throw new BadRequestException('applicationIds must be a non-empty array.');
  }

  if (
    !VOLUNTEER_STATUSES.includes(
      input.nextStatus as (typeof VOLUNTEER_STATUSES)[number],
    ) ||
    (input.nextStatus as string) === 'PENDING'
  ) {
    throw new BadRequestException(
      'nextStatus must be APPROVED or REJECTED.',
    );
  }

  if (input.nextStatus === 'REJECTED' && !input.reason) {
    throw new BadRequestException('reason is required when rejecting.');
  }
}

function assertCreateWarningDto(input: CreateWarningDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (!input.title || typeof input.title !== 'string') {
    throw new BadRequestException('title is required and must be a string.');
  }

  if (!input.message || typeof input.message !== 'string') {
    throw new BadRequestException('message is required and must be a string.');
  }

  if (
    !HAZARD_TYPES.includes(input.hazardType as (typeof HAZARD_TYPES)[number])
  ) {
    throw new BadRequestException(
      `hazardType must be one of: ${HAZARD_TYPES.join(', ')}.`,
    );
  }

  if (
    !SEVERITY_LEVELS.includes(
      input.severity as (typeof SEVERITY_LEVELS)[number],
    )
  ) {
    throw new BadRequestException(
      `severity must be one of: ${SEVERITY_LEVELS.join(', ')}.`,
    );
  }

  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    throw new BadRequestException('targets must contain at least one entry.');
  }

  for (const target of input.targets) {
    if (!target || typeof target !== 'object') {
      throw new BadRequestException('each target must be an object.');
    }
    if (!target.areaName || typeof target.areaName !== 'string') {
      throw new BadRequestException('target.areaName is required.');
    }
    if (target.radiusKm != null && Number(target.radiusKm) <= 0) {
      throw new BadRequestException('target.radiusKm must be greater than 0.');
    }
  }

  if (!Array.isArray(input.evacuationAreaIds)) {
    throw new BadRequestException('evacuationAreaIds must be an array.');
  }
}

function assertUpdateWarningDto(input: UpdateWarningDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (input.title !== undefined && typeof input.title !== 'string') {
    throw new BadRequestException('title must be a string.');
  }

  if (input.message !== undefined && typeof input.message !== 'string') {
    throw new BadRequestException('message must be a string.');
  }

  if (
    input.hazardType !== undefined &&
    !HAZARD_TYPES.includes(input.hazardType as (typeof HAZARD_TYPES)[number])
  ) {
    throw new BadRequestException(
      `hazardType must be one of: ${HAZARD_TYPES.join(', ')}.`,
    );
  }

  if (
    input.severity !== undefined &&
    !SEVERITY_LEVELS.includes(
      input.severity as (typeof SEVERITY_LEVELS)[number],
    )
  ) {
    throw new BadRequestException(
      `severity must be one of: ${SEVERITY_LEVELS.join(', ')}.`,
    );
  }
}

function assertWarningPromptSuggestionDto(
  input: WarningPromptSuggestionDto,
): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (!input.hazardType || typeof input.hazardType !== 'string') {
    throw new BadRequestException('hazardType is required.');
  }

  if (!input.areaOrRegion || typeof input.areaOrRegion !== 'string') {
    throw new BadRequestException('areaOrRegion is required.');
  }

  if (input.radiusKm != null && Number(input.radiusKm) <= 0) {
    throw new BadRequestException('radiusKm must be greater than 0.');
  }
}

const PIN_REVIEW_ACTIONS = ['APPROVE', 'REJECT'] as const;
const DAMAGE_REPORT_REVIEW_ACTIONS = ['APPROVE', 'REJECT'] as const;

function assertReviewPinDto(input: ReviewPinDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (
    !PIN_REVIEW_ACTIONS.includes(input.action as (typeof PIN_REVIEW_ACTIONS)[number])
  ) {
    throw new BadRequestException(
      'action must be one of: APPROVE, REJECT.',
    );
  }

  if (input.action === 'REJECT' && !input.reason) {
    throw new BadRequestException('reason is required when rejecting a pin.');
  }

  if (input.reason != null && typeof input.reason !== 'string') {
    throw new BadRequestException('reason must be a string.');
  }
}

function assertReviewDamageReportDto(input: ReviewDamageReportDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (
    !DAMAGE_REPORT_REVIEW_ACTIONS.includes(
      input.action as (typeof DAMAGE_REPORT_REVIEW_ACTIONS)[number],
    )
  ) {
    throw new BadRequestException('action must be one of: APPROVE, REJECT.');
  }

  if (input.action === 'REJECT' && !input.reason) {
    throw new BadRequestException(
      'reason is required when rejecting a damage report.',
    );
  }

  if (input.reason != null && typeof input.reason !== 'string') {
    throw new BadRequestException('reason must be a string.');
  }
}

function assertAdminWeatherForecastDto(input: unknown): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Query parameters are required.');
  }

  const candidate = input as Record<string, unknown>;

  if (candidate.latitude == null || isNaN(Number(candidate.latitude))) {
    throw new BadRequestException('latitude is required and must be a number.');
  }
  if (candidate.longitude == null || isNaN(Number(candidate.longitude))) {
    throw new BadRequestException('longitude is required and must be a number.');
  }

  if (candidate.forecast_days != null) {
    const parsed = Number(candidate.forecast_days);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 16) {
      throw new BadRequestException(
        'forecast_days must be an integer between 1 and 16.',
      );
    }
  }

  if (candidate.past_days != null) {
    const parsed = Number(candidate.past_days);
    if (parsed !== 1 && parsed !== 2) {
      throw new BadRequestException('past_days must be 1 or 2.');
    }
  }
}

function assertAdminWeatherGeocodingDto(input: unknown): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Query parameters are required.');
  }

  const candidate = input as Record<string, unknown>;

  if (!candidate.name || typeof candidate.name !== 'string') {
    throw new BadRequestException('name is required and must be a string.');
  }

  if (candidate.count != null) {
    const parsed = Number(candidate.count);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('count must be an integer between 1 and 100.');
    }
  }

  if (
    candidate.format != null &&
    candidate.format !== 'json' &&
    candidate.format !== 'protobuf'
  ) {
    throw new BadRequestException("format must be either 'json' or 'protobuf'.");
  }
}

function parseCsv<T extends string>(value?: string): T[] | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];

  return parsed.length > 0 ? parsed : undefined;
}

@ApiTags('admin-operations')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard, AdminRoleGuard)
@Controller('admin')
export class AdminOperationsController {
  constructor(private readonly adminService: AdminOperationsService) { }

  @Get('volunteers/applications')
  @ApiOperation({ summary: 'List volunteer applications for admin review' })
  async listVolunteerApplications(
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.listVolunteerApplications({
      status: parseVolunteerStatus(status),
      sortBy,
      sortOrder,
    });
  }

  @Post('volunteers/applications/:id/review')
  @ApiOperation({ summary: 'Approve or reject volunteer application' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ReviewVolunteerDto })
  async reviewVolunteer(
    @Param('id') applicationId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: ReviewVolunteerDto,
  ) {
    assertReviewVolunteerDto(body);

    return this.adminService.reviewVolunteerApplication({
      applicationId,
      reviewerId: session.user.id,
      nextStatus: body.nextStatus,
      reason: body.reason,
    });
  }

  @Post('volunteers/applications/bulk-review')
  @ApiOperation({ summary: 'Bulk approve or reject volunteer applications' })
  @ApiBody({ type: BulkReviewVolunteerDto })
  async bulkReviewVolunteers(
    @AuthSessionParam() session: AuthSession,
    @Body() body: BulkReviewVolunteerDto,
  ) {
    assertBulkReviewVolunteerDto(body);

    return this.adminService.bulkReviewVolunteerApplications({
      applicationIds: body.applicationIds,
      reviewerId: session.user.id,
      nextStatus: body.nextStatus,
      reason: body.reason,
    });
  }

  @Post('volunteers/:userId/suspend')
  @ApiOperation({ summary: 'Suspend volunteer profile' })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: SuspendReactivateVolunteerDto })
  async suspendVolunteer(
    @Param('userId') userId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: SuspendReactivateVolunteerDto,
  ) {
    return this.adminService.suspendVolunteer(userId, session.user.id, body.reason);
  }

  @Post('volunteers/:userId/reactivate')
  @ApiOperation({ summary: 'Reactivate volunteer profile' })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: SuspendReactivateVolunteerDto })
  async reactivateVolunteer(
    @Param('userId') userId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: SuspendReactivateVolunteerDto,
  ) {
    return this.adminService.reactivateVolunteer(userId, session.user.id, body.reason);
  }

  @Get('volunteers/applications/:id/history')
  @ApiOperation({ summary: 'Get decision history for an application' })
  @ApiParam({ name: 'id', type: String })
  async getApplicationHistory(@Param('id') applicationId: string) {
    return this.adminService.getApplicationHistory(applicationId);
  }

  @Get('assets/registry')
  @ApiOperation({ summary: 'List volunteered assets (users who registered assets for disaster use)' })
  @ApiOkResponse({ type: [AdminAssetRegistryEntryDto] })
  async getAssetRegistry() {
    return this.adminService.getAssetRegistry();
  }

  @Post('assets/:id/review')
  @ApiOperation({ summary: 'Approve or reject a volunteered asset' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ReviewAssetDto })
  async reviewAsset(
    @Param('id') assetId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: ReviewAssetDto,
  ) {
    if (!['APPROVE', 'REJECT'].includes(body.action)) {
      throw new BadRequestException('action must be APPROVE or REJECT');
    }
    return this.adminService.reviewAsset({
      assetId,
      reviewerId: session.user.id,
      action: body.action,
      reason: body.reason,
    });
  }

  @Post('warnings')
  @ApiOperation({ summary: 'Manually create and dispatch warning event' })
  @ApiBody({ type: CreateWarningDto })
  async createWarning(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreateWarningDto,
  ) {
    assertCreateWarningDto(body);

    const schedule = parseDateRange({
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });

    return this.adminService.createWarning({
      title: body.title,
      message: body.message,
      hazardType: body.hazardType,
      severity: body.severity,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      suggestedPrompt: body.suggestedPrompt,
      creatorId: session.user.id,
      targets: body.targets,
      evacuationAreaIds: body.evacuationAreaIds,
    });
  }

  @Get('warnings')
  @ApiOperation({ summary: 'List warning events for admin management' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: WARNING_STATUSES,
    description: 'Optional warning status filter.',
  })
  @ApiOkResponse({ type: [AdminWarningListItemDto] })
  async listWarnings(@Query('status') status?: string) {
    return this.adminService.listWarnings({
      status: parseWarningStatus(status),
    });
  }

  @Patch('warnings/:id')
  @ApiOperation({ summary: 'Update an existing warning event' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWarningDto })
  async updateWarning(
    @Param('id') warningId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: UpdateWarningDto,
  ) {
    assertUpdateWarningDto(body);

    return this.adminService.updateWarning({
      warningId,
      title: body.title,
      message: body.message,
      hazardType: body.hazardType,
      severity: body.severity,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      actorId: session.user.id,
    });
  }

  @Post('warnings/:id/cancel')
  @ApiOperation({ summary: 'Cancel an active warning event' })
  @ApiParam({ name: 'id', type: String })
  async cancelWarning(
    @Param('id') warningId: string,
    @AuthSessionParam() session: AuthSession,
  ) {
    return this.adminService.cancelWarning(warningId, session.user.id);
  }

  @Delete('warnings/:id')
  @ApiOperation({ summary: 'Delete warning event (false alarm cleanup)' })
  @ApiParam({ name: 'id', type: String })
  async deleteWarning(@Param('id') warningId: string) {
    return this.adminService.deleteWarning(warningId);
  }

  @Get('vulnerable-regions')
  @ApiOperation({ summary: 'Get vulnerable region dashboard data' })
  async vulnerableRegions() {
    return this.adminService.getVulnerableRegions();
  }

  @Get('pins/statuses')
  @ApiOperation({ summary: 'Get operational pin statuses' })
  async pinStatuses() {
    return this.adminService.getPinStatuses();
  }

  @Get('damage-reports')
  @ApiOperation({ summary: 'List submitted damage reports for admin review' })
  @ApiOkResponse({ type: [AdminDamageReportDto] })
  async damageReports() {
    return this.adminService.getDamageReports();
  }

  @Post('pins/:id/review')
  @ApiOperation({ summary: 'Approve or reject a hazard pin (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ReviewPinDto })
  async reviewPin(
    @Param('id') pinId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: ReviewPinDto,
  ) {
    assertReviewPinDto(body);
    return this.adminService.reviewPin({
      pinId,
      reviewerId: session.user.id,
      action: body.action,
      reason: body.reason,
    });
  }

  @Post('damage-reports/:id/review')
  @ApiOperation({ summary: 'Approve or reject a submitted damage report (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ReviewDamageReportDto })
  async reviewDamageReport(
    @Param('id') damageReportId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: ReviewDamageReportDto,
  ) {
    assertReviewDamageReportDto(body);
    return this.adminService.reviewDamageReport({
      damageReportId,
      reviewerId: session.user.id,
      action: body.action,
      reason: body.reason,
    });
  }

  @Post('warnings/prompt-suggestion')
  @ApiOperation({ summary: 'Get suggested warning prompt template' })
  @ApiBody({ type: WarningPromptSuggestionDto })
  async getPromptSuggestion(@Body() body: WarningPromptSuggestionDto) {
    assertWarningPromptSuggestionDto(body);
    return this.adminService.getWarningPromptSuggestion(body);
  }

  @Get('users/locations')
  @ApiOperation({ summary: 'Get all user location snapshots for the map' })
  async userLocations() {
    return this.adminService.getUserLocations();
  }

  @Get('map/overview')
  @ApiOperation({ summary: 'Get complete admin map datasets in one response' })
  async mapOverview(): Promise<MapOverviewResponseDto> {
    return (await this.adminService.getMapOverview()) as MapOverviewResponseDto;
  }

  @Get('weather/forecast')
  @ApiOperation({ summary: 'Get weather forecast from Open-Meteo for the map' })
  async weatherForecast(@Query() query: AdminWeatherForecastDto) {
    assertAdminWeatherForecastDto(query);

    return this.adminService.getWeatherForecast({
      latitude: Number(query.latitude),
      longitude: Number(query.longitude),
      hourly: parseCsv<OpenMeteoForecastHourlyVariable>(query.hourly),
      daily: parseCsv<OpenMeteoForecastDailyVariable>(query.daily),
      models: query.models as OpenMeteoModel | undefined,
      timezone: query.timezone,
      current_weather:
        query.current_weather === undefined
          ? undefined
          : String(query.current_weather) === 'true',
      temperature_unit: query.temperature_unit,
      wind_speed_unit: query.wind_speed_unit,
      precipitation_unit: query.precipitation_unit,
      past_days:
        query.past_days === undefined ? undefined : (Number(query.past_days) as 1 | 2),
      forecast_days:
        query.forecast_days === undefined ? undefined : Number(query.forecast_days),
    });
  }

  @Get('weather/geocoding')
  @ApiOperation({ summary: 'Search locations using Open-Meteo geocoding' })
  async weatherGeocoding(@Query() query: AdminWeatherGeocodingDto) {
    assertAdminWeatherGeocodingDto(query);

    return this.adminService.getWeatherGeocoding({
      name: query.name,
      count: query.count == null ? undefined : Number(query.count),
      language: query.language,
      countryCode: query.countryCode,
      format: query.format,
    });
  }
}
