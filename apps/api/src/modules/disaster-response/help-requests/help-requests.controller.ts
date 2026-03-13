import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { ApprovedVolunteerGuard } from '../shared/approved-volunteer.guard';
import { HelpRequestsService } from './help-requests.service';

const HAZARD_TYPES = ['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] as const;
const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const HELP_REQUEST_STATUSES = ['OPEN', 'CLAIMED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'] as const;
const ASSIGNMENT_STATUSES = ['CLAIMED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'CANCELLED'] as const;

class CreateHelpRequestDto {
  @ApiPropertyOptional()
  familyId?: string;

  @ApiProperty({ enum: HAZARD_TYPES })
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';

  @ApiProperty({ enum: URGENCY_LEVELS })
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty()
  description!: string;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;
}

class CreateSosDto {
  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;
}

class UpdateHelpRequestStatusDto {
  @ApiProperty({ enum: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'] })
  nextStatus!: 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
}

class HelpRequestRequesterSummaryDto {
  @ApiProperty()
  name!: string;
}

class HelpRequestEventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ enum: HELP_REQUEST_STATUSES, nullable: true })
  previousStatus?: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | null;

  @ApiProperty({ enum: HELP_REQUEST_STATUSES })
  nextStatus!: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

  @ApiPropertyOptional({ nullable: true })
  note?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

class HelpAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ASSIGNMENT_STATUSES })
  status!: 'CLAIMED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty()
  assignedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  helpRequestId!: string;

  @ApiProperty()
  volunteerId!: string;
}

class HelpRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  requesterId!: string;

  @ApiPropertyOptional({ nullable: true })
  familyId?: string | null;

  @ApiProperty({ enum: HAZARD_TYPES })
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';

  @ApiProperty({ enum: URGENCY_LEVELS })
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ enum: HELP_REQUEST_STATUSES })
  status!: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

  @ApiProperty()
  description!: string;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiPropertyOptional({ nullable: true })
  sosExpiresAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class HelpRequestWithHistoryResponseDto extends HelpRequestResponseDto {
  @ApiProperty({ type: [HelpAssignmentResponseDto] })
  assignments!: HelpAssignmentResponseDto[];

  @ApiProperty({ type: [HelpRequestEventResponseDto] })
  events!: HelpRequestEventResponseDto[];
}

class OpenHelpRequestResponseDto extends HelpRequestResponseDto {
  @ApiProperty({ type: HelpRequestRequesterSummaryDto })
  requester!: HelpRequestRequesterSummaryDto;
}

class HelpRequestForAssignmentResponseDto extends HelpRequestResponseDto {
  @ApiProperty({ type: HelpRequestRequesterSummaryDto })
  requester!: HelpRequestRequesterSummaryDto;

  @ApiProperty({ type: [HelpRequestEventResponseDto] })
  events!: HelpRequestEventResponseDto[];
}

class VolunteerAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  helpRequestId!: string;

  @ApiProperty()
  volunteerId!: string;

  @ApiProperty({ enum: ASSIGNMENT_STATUSES })
  status!: 'CLAIMED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty()
  assignedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: HelpRequestForAssignmentResponseDto })
  helpRequest!: HelpRequestForAssignmentResponseDto;
}

type HelpRequestLike = {
  id: string;
  requesterId: string;
  familyId?: string | null;
  hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  description: string;
  latitude: number;
  longitude: number;
  sosExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AssignmentLike = {
  id: string;
  helpRequestId: string;
  volunteerId: string;
  status: 'CLAIMED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED';
  assignedAt: Date;
  updatedAt: Date;
};

type EventLike = {
  id: string;
  previousStatus?: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | null;
  nextStatus: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  note?: string | null;
  createdAt: Date;
};

function mapHelpRequestBase(request: HelpRequestLike): HelpRequestResponseDto {
  return {
    id: request.id,
    requesterId: request.requesterId,
    familyId: request.familyId ?? null,
    hazardType: request.hazardType,
    urgency: request.urgency,
    status: request.status,
    description: request.description,
    latitude: request.latitude,
    longitude: request.longitude,
    sosExpiresAt: request.sosExpiresAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function mapAssignment(assignment: AssignmentLike): HelpAssignmentResponseDto {
  return {
    id: assignment.id,
    helpRequestId: assignment.helpRequestId,
    volunteerId: assignment.volunteerId,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    updatedAt: assignment.updatedAt,
  };
}

function mapEvent(event: EventLike): HelpRequestEventResponseDto {
  return {
    id: event.id,
    previousStatus: event.previousStatus ?? null,
    nextStatus: event.nextStatus,
    note: event.note ?? null,
    createdAt: event.createdAt,
  };
}

function mapHelpRequestWithHistory(request: HelpRequestLike & {
  assignments: AssignmentLike[];
  events: EventLike[];
}): HelpRequestWithHistoryResponseDto {
  return {
    ...mapHelpRequestBase(request),
    assignments: request.assignments.map(mapAssignment),
    events: request.events.map(mapEvent),
  };
}

function mapOpenHelpRequest(request: HelpRequestLike & {
  requester?: { name?: string | null } | null;
}): OpenHelpRequestResponseDto {
  return {
    ...mapHelpRequestBase(request),
    requester: {
      name: request.requester?.name ?? 'Unknown',
    },
  };
}

function mapVolunteerAssignment(assignment: AssignmentLike & {
  helpRequest: HelpRequestLike & {
    requester?: { name?: string | null } | null;
    events: EventLike[];
  };
}): VolunteerAssignmentResponseDto {
  return {
    id: assignment.id,
    helpRequestId: assignment.helpRequestId,
    volunteerId: assignment.volunteerId,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    updatedAt: assignment.updatedAt,
    helpRequest: {
      ...mapHelpRequestBase(assignment.helpRequest),
      requester: {
        name: assignment.helpRequest.requester?.name ?? 'Unknown',
      },
      events: assignment.helpRequest.events.map(mapEvent),
    },
  };
}

@ApiTags('help-requests')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard)
@Controller('help-requests')
export class HelpRequestsController {
  constructor(private readonly helpRequestsService: HelpRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create emergency help request' })
  @ApiBody({ type: CreateHelpRequestDto })
  @ApiOkResponse({ type: HelpRequestResponseDto })
  async create(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    const created = await this.helpRequestsService.create({
      requesterId: session.user.id,
      familyId: body.familyId,
      hazardType: body.hazardType,
      urgency: body.urgency,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return mapHelpRequestBase(created);
  }

  @Post('sos')
  @ApiOperation({ summary: 'One-tap SOS: create help request with current location only (time-limited)' })
  @ApiBody({ type: CreateSosDto })
  @ApiOkResponse({ type: HelpRequestResponseDto })
  async createSos(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreateSosDto,
  ): Promise<HelpRequestResponseDto> {
    const sosExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const created = await this.helpRequestsService.create({
      requesterId: session.user.id,
      hazardType: 'FLOOD',
      urgency: 'CRITICAL',
      description: 'SOS',
      latitude: body.latitude,
      longitude: body.longitude,
      sosExpiresAt,
    });

    return mapHelpRequestBase(created);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my help requests and status history' })
  @ApiOkResponse({ type: [HelpRequestWithHistoryResponseDto] })
  async me(@AuthSessionParam() session: AuthSession): Promise<HelpRequestWithHistoryResponseDto[]> {
    const requests = await this.helpRequestsService.listMine(session.user.id);
    return requests.map(mapHelpRequestWithHistory);
  }

  @Get()
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'List all open help requests for volunteers' })
  @ApiOkResponse({ type: [OpenHelpRequestResponseDto] })
  async listOpen(@AuthSessionParam() session: AuthSession): Promise<OpenHelpRequestResponseDto[]> {
    const requests = await this.helpRequestsService.findAllOpen(session.user.id);
    return requests.map(mapOpenHelpRequest);
  }

  @Get('assignments')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'List help requests assigned to the current volunteer' })
  @ApiOkResponse({ type: [VolunteerAssignmentResponseDto] })
  async assignments(@AuthSessionParam() session: AuthSession): Promise<VolunteerAssignmentResponseDto[]> {
    const assignments = await this.helpRequestsService.listAssignments(session.user.id);
    return assignments.map(mapVolunteerAssignment);
  }

  @Post(':id/claim')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'Claim help request as approved volunteer' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: HelpAssignmentResponseDto })
  async claim(
    @Param('id') helpRequestId: string,
    @AuthSessionParam() session: AuthSession,
  ): Promise<HelpAssignmentResponseDto> {
    const assignment = await this.helpRequestsService.claim(helpRequestId, session.user.id);
    return mapAssignment(assignment);
  }

  @Patch(':id/status')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'Update claimed help request status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateHelpRequestStatusDto })
  @ApiOkResponse({ type: HelpRequestResponseDto })
  async updateStatus(
    @Param('id') helpRequestId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: UpdateHelpRequestStatusDto,
  ): Promise<HelpRequestResponseDto> {
    if (!['IN_PROGRESS', 'RESOLVED', 'CANCELLED'].includes(body.nextStatus)) {
      throw new BadRequestException('nextStatus must be one of: IN_PROGRESS, RESOLVED, CANCELLED.');
    }

    const updated = await this.helpRequestsService.updateAssignmentStatus({
      helpRequestId,
      volunteerId: session.user.id,
      nextStatus: body.nextStatus,
    });

    return mapHelpRequestBase(updated);
  }
}
