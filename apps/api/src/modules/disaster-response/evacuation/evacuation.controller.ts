import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { EvacuationService } from './evacuation.service';
import { NearestEvacResponseDto, RouteToAreaResponseDto } from './evacuation-response.dto';

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
  @ApiOperation({
    summary: 'Nearest evacuation sites; with rainfall_mm uses hazard-aware routing (safest first)',
  })
  @ApiResponse({ status: 200, description: 'List of nearest evacuation areas with optional route and risk metrics', type: [NearestEvacResponseDto] })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vehicleType', required: false, enum: ['driving', 'walking', 'cycling'] })
  @ApiQuery({
    name: 'rainfall_mm',
    required: false,
    type: Number,
    description: 'Rainfall in mm; when provided and hazard server configured, returns hazard-aware safest routes',
  })
  async nearest(
    @Query('latitude') latStr: string,
    @Query('longitude') lonStr: string,
    @Query('limit') limitStr?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('rainfall_mm') rainfallMmStr?: string,
  ) {
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    const limit = limitStr ? Math.min(50, Math.max(1, parseInt(limitStr, 10))) : 10;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return [];
    }
    const rainfallMm =
      rainfallMmStr !== undefined && rainfallMmStr !== ''
        ? parseFloat(rainfallMmStr)
        : undefined;
    return this.evacuationService.getNearest(
      latitude,
      longitude,
      limit,
      vehicleType ?? 'driving',
      Number.isNaN(rainfallMm as number) ? undefined : rainfallMm,
    );
  }

  @Get('hazard-route')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Hazard-aware route between two coordinates; uses hazard server with rainfall_mm',
  })
  @ApiQuery({ name: 'fromLat', required: true, type: Number })
  @ApiQuery({ name: 'fromLon', required: true, type: Number })
  @ApiQuery({ name: 'toLat', required: true, type: Number })
  @ApiQuery({ name: 'toLon', required: true, type: Number })
  @ApiQuery({ name: 'rainfall_mm', required: true, type: Number })
  async hazardRoute(
    @Query('fromLat') fromLatStr: string,
    @Query('fromLon') fromLonStr: string,
    @Query('toLat') toLatStr: string,
    @Query('toLon') toLonStr: string,
    @Query('rainfall_mm') rainfallMmStr: string,
  ) {
    const fromLat = parseFloat(fromLatStr);
    const fromLon = parseFloat(fromLonStr);
    const toLat = parseFloat(toLatStr);
    const toLon = parseFloat(toLonStr);
    const rainfallMm = parseFloat(rainfallMmStr);
    if (
      Number.isNaN(fromLat) ||
      Number.isNaN(fromLon) ||
      Number.isNaN(toLat) ||
      Number.isNaN(toLon) ||
      Number.isNaN(rainfallMm)
    ) {
      return null;
    }
    return this.evacuationService.getHazardRoute(
      fromLat,
      fromLon,
      toLat,
      toLon,
      rainfallMm,
    );
  }

  @Get('route')
  @ApiOperation({
    summary: 'Route to a specific evacuation area; optional hazard-aware when rainfall_mm provided',
  })
  @ApiResponse({ status: 200, description: 'Route to the evacuation area with optional hazard metrics', type: RouteToAreaResponseDto })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'evacuationAreaId', required: true, type: String })
  @ApiQuery({ name: 'vehicleType', required: false, enum: ['driving', 'walking', 'cycling'] })
  @ApiQuery({ name: 'rainfall_mm', required: false, type: Number })
  async route(
    @Query('latitude') latStr: string,
    @Query('longitude') lonStr: string,
    @Query('evacuationAreaId') evacuationAreaId: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('rainfall_mm') rainfallMmStr?: string,
  ) {
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    if (Number.isNaN(latitude) || Number.isNaN(longitude) || !evacuationAreaId?.trim()) {
      return null;
    }
    const rainfallMm =
      rainfallMmStr !== undefined && rainfallMmStr !== ''
        ? parseFloat(rainfallMmStr)
        : undefined;
    return this.evacuationService.getRouteToArea(
      latitude,
      longitude,
      evacuationAreaId.trim(),
      vehicleType ?? 'driving',
      Number.isNaN(rainfallMm as number) ? undefined : rainfallMm,
    );
  }

  @Get('routes/suggested')
  @ApiBearerAuth()
  @UseGuards(AuthSessionGuard)
  @ApiOperation({ summary: 'Get warning-context route suggestions to shelters' })
  async suggested(@AuthSessionParam() session: AuthSession) {
    return this.evacuationService.getSuggestedRoutes(session.user.id);
  }
}
