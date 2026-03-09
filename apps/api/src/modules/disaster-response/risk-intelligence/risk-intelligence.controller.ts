import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { parseLatitudeLongitude } from '../shared/request-validation';
import { RiskIntelligenceService } from './risk-intelligence.service';

@ApiTags('risk-intelligence')
@Controller('risk')
export class RiskIntelligenceController {
  constructor(private readonly riskService: RiskIntelligenceService) {}

  @Get('forecast')
  @ApiOperation({ summary: 'Get weather-driven risk forecast for a location' })
  @ApiQuery({ name: 'latitude', type: Number })
  @ApiQuery({ name: 'longitude', type: Number })
  @ApiQuery({ name: 'forecastDays', type: Number, required: false })
  async getForecast(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('forecastDays') forecastDays?: string,
  ) {
    const coords = parseLatitudeLongitude({ latitude, longitude });

    return this.riskService.getForecast(
      coords.latitude,
      coords.longitude,
      forecastDays ? Number(forecastDays) : 3,
    );
  }

  @Get('user-impact')
  @UseGuards(AuthSessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get impact summary for current user and family' })
  async getUserImpact(@AuthSessionParam() authSession: AuthSession) {
    return this.riskService.getUserImpact(authSession.user.id);
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get all active risk regions' })
  async getVulnerableRegions() {
    return this.riskService.getVulnerableRegions();
  }
  @Get('building-profiles')
  @ApiOperation({ summary: 'Get building profiles (GeoJSON) for a location' })
  @ApiQuery({ name: 'latitude', type: Number })
  @ApiQuery({ name: 'longitude', type: Number })
  async getBuildingProfiles(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    const coords = parseLatitudeLongitude({ latitude, longitude });

    return this.riskService.getBuildingProfileGeoJson(
      coords.latitude,
      coords.longitude,
    );
  }
}
