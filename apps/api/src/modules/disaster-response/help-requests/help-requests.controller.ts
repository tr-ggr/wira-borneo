import {
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
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { ApprovedVolunteerGuard } from '../shared/approved-volunteer.guard';
import { HelpRequestsService } from './help-requests.service';

class CreateHelpRequestDto {
  familyId?: string;
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description!: string;
  latitude!: number;
  longitude!: number;
}

class UpdateHelpRequestStatusDto {
  nextStatus!: 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
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
  async create(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreateHelpRequestDto,
  ) {
    return this.helpRequestsService.create({
      requesterId: session.user.id,
      familyId: body.familyId,
      hazardType: body.hazardType,
      urgency: body.urgency,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'List my help requests and status history' })
  async me(@AuthSessionParam() session: AuthSession) {
    return this.helpRequestsService.listMine(session.user.id);
  }

  @Get()
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'List all open help requests for volunteers' })
  async listOpen(@AuthSessionParam() session: AuthSession) {
    return this.helpRequestsService.findAllOpen(session.user.id);
  }

  @Get('assignments')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'List help requests assigned to the current volunteer' })
  async assignments(@AuthSessionParam() session: AuthSession) {
    return this.helpRequestsService.listAssignments(session.user.id);
  }

  @Post(':id/claim')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'Claim help request as approved volunteer' })
  @ApiParam({ name: 'id', type: String })
  async claim(
    @Param('id') helpRequestId: string,
    @AuthSessionParam() session: AuthSession,
  ) {
    return this.helpRequestsService.claim(helpRequestId, session.user.id);
  }

  @Patch(':id/status')
  @UseGuards(ApprovedVolunteerGuard)
  @ApiOperation({ summary: 'Update claimed help request status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateHelpRequestStatusDto })
  async updateStatus(
    @Param('id') helpRequestId: string,
    @AuthSessionParam() session: AuthSession,
    @Body() body: UpdateHelpRequestStatusDto,
  ) {
    return this.helpRequestsService.updateAssignmentStatus({
      helpRequestId,
      volunteerId: session.user.id,
      nextStatus: body.nextStatus,
    });
  }
}
