import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpHazardRoutingProvider } from './hazard-routing.provider';

@ApiTags('hazard-risk-layer')
@Controller('hazard-risk-layer')
export class HazardRiskLayerController {
  constructor(private readonly hazardProvider: HttpHazardRoutingProvider) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Risk points for map layer (from hazard routing server); color by risk, hover for details',
  })
  @ApiQuery({ name: 'rainfall_mm', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Array of risk points (latitude, longitude, risk, elevation, etc.)' })
  async getRiskLayer(@Query('rainfall_mm') rainfallMmStr?: string) {
    const rainfallMm =
      rainfallMmStr !== undefined && rainfallMmStr !== ''
        ? parseFloat(rainfallMmStr)
        : 0;
    const points = await this.hazardProvider.getRiskPoints(
      Number.isNaN(rainfallMm) ? 0 : rainfallMm,
    );
    return points;
  }
}
