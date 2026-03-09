import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { EvacuationService } from './evacuation.service';

@ApiTags('evacuation')
@Controller('evacuation')
export class EvacuationController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Get('areas')
  @ApiOperation({ summary: 'List active evacuation areas (public)' })
  async areas() {
    return this.evacuationService.getAreas();
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Nearest evacuation sites by distance, top 5 re-sorted by OSRM duration' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vehicleType', required: false, enum: ['driving', 'walking', 'cycling'] })
  async nearest(
    @Query('latitude') latStr: string,
    @Query('longitude') lonStr: string,
    @Query('limit') limitStr?: string,
    @Query('vehicleType') vehicleType?: string,
  ) {
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    const limit = limitStr ? Math.min(50, Math.max(1, parseInt(limitStr, 10))) : 10;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return [];
    }
    return this.evacuationService.getNearest(latitude, longitude, limit, vehicleType ?? 'driving');
  }

  @Get('routes/suggested')
  @ApiBearerAuth()
  @UseGuards(AuthSessionGuard)
  @ApiOperation({ summary: 'Get warning-context route suggestions to shelters' })
  async suggested(@AuthSessionParam() session: AuthSession) {
    return this.evacuationService.getSuggestedRoutes(session.user.id);
  }
}
