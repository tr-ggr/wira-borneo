import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthOutbreakService } from './health-outbreak.service';

@ApiTags('health-outbreak')
@Controller('health-outbreak')
export class HealthOutbreakController {
  constructor(private readonly healthOutbreakService: HealthOutbreakService) {}

  @Get('dengue/regions')
  @ApiOperation({ summary: 'Get Philippine regions GeoJSON with dengue risk scores per region' })
  async getDengueRegions() {
    return this.healthOutbreakService.getDengueRegionsGeoJSON();
  }
}
