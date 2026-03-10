import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoutingService } from './routing.service';

@ApiTags('routing')
@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Get('route')
  @ApiOperation({ summary: 'Get road route between two points (OSRM)' })
  @ApiQuery({ name: 'fromLon', required: true, type: Number })
  @ApiQuery({ name: 'fromLat', required: true, type: Number })
  @ApiQuery({ name: 'toLon', required: true, type: Number })
  @ApiQuery({ name: 'toLat', required: true, type: Number })
  @ApiQuery({ name: 'vehicleType', required: false, enum: ['driving', 'walking', 'cycling'] })
  async getRoute(
    @Query('fromLon') fromLon: string,
    @Query('fromLat') fromLat: string,
    @Query('toLon') toLon: string,
    @Query('toLat') toLat: string,
    @Query('vehicleType') vehicleType?: string,
  ) {
    const fromLonNum = parseFloat(fromLon);
    const fromLatNum = parseFloat(fromLat);
    const toLonNum = parseFloat(toLon);
    const toLatNum = parseFloat(toLat);
    if (
      Number.isNaN(fromLonNum) ||
      Number.isNaN(fromLatNum) ||
      Number.isNaN(toLonNum) ||
      Number.isNaN(toLatNum)
    ) {
      return { route: null, error: 'Invalid coordinates' };
    }
    const route = await this.routingService.getRoute(
      fromLonNum,
      fromLatNum,
      toLonNum,
      toLatNum,
      vehicleType ?? 'driving',
    );
    return { route };
  }
}
