import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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

class WarningPromptSuggestionDto {
  hazardType!: string;
  areaOrRegion!: string;
  radiusKm?: number;
}

const VOLUNTEER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const HAZARD_TYPES = ['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] as const;
const SEVERITY_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;

function parseVolunteerStatus(value?: string):
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | undefined {
  if (!value) {
    return undefined;
  }

  if (!VOLUNTEER_STATUSES.includes(value as (typeof VOLUNTEER_STATUSES)[number])) {
    throw new BadRequestException(
      `status must be one of: ${VOLUNTEER_STATUSES.join(', ')}.`,
    );
  }

  return value as 'PENDING' | 'APPROVED' | 'REJECTED';
}

function assertReviewVolunteerDto(input: ReviewVolunteerDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (
    !VOLUNTEER_STATUSES.includes(
      input.nextStatus as (typeof VOLUNTEER_STATUSES)[number],
    ) ||
    input.nextStatus === 'PENDING'
  ) {
    throw new BadRequestException(
      'nextStatus must be APPROVED or REJECTED.',
    );
  }

  if (input.reason != null && typeof input.reason !== 'string') {
    throw new BadRequestException('reason must be a string.');
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

@ApiTags('admin-operations')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard, AdminRoleGuard)
@Controller('admin')
export class AdminOperationsController {
  constructor(private readonly adminService: AdminOperationsService) {}

  @Get('volunteers/applications')
  @ApiOperation({ summary: 'List volunteer applications for admin review' })
  async listVolunteerApplications(@Query('status') status?: string) {
    return this.adminService.listVolunteerApplications(parseVolunteerStatus(status));
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

  @Post('warnings/prompt-suggestion')
  @ApiOperation({ summary: 'Get suggested warning prompt template' })
  @ApiBody({ type: WarningPromptSuggestionDto })
  getPromptSuggestion(@Body() body: WarningPromptSuggestionDto) {
    assertWarningPromptSuggestionDto(body);
    return this.adminService.getWarningPromptSuggestion(body);
  }
}
