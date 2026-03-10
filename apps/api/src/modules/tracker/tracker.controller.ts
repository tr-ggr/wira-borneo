import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { TrackerService } from './tracker.service';

class TrackerShipmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() shipmentId!: string;
  @ApiProperty() origin!: string;
  @ApiProperty() destination!: string;
  @ApiProperty() class!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) blockchainHash?: string | null;
  @ApiProperty({ enum: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] }) status!: string;
  @ApiProperty({ enum: ['VERIFIED', 'PENDING', 'FAILED'] }) verificationStatus!: string;
  @ApiProperty() timestamp!: Date;
}

class TrackerStatsDto {
  @ApiProperty() totalAidDisbursed!: number;
  @ApiProperty() verifiedPayouts!: number;
  @ApiProperty() networkTrustIndex!: number;
}

class TrackerReliefZoneDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() lat!: number;
  @ApiProperty() lng!: number;
  @ApiProperty() familyCount!: number;
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] }) status!: string;
  @ApiProperty() zoneType!: string;
}

class TrackerValidatorDto {
  @ApiProperty() id!: string;
  @ApiProperty() nodeId!: string;
  @ApiProperty() location!: string;
  @ApiProperty() latencyMs!: number;
  @ApiProperty() uptimePercentage!: number;
  @ApiProperty({ enum: ['ONLINE', 'OFFLINE', 'DEGRADED'] }) status!: string;
}

@ApiTags('tracker')
@Controller('tracker')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Get('shipments')
  @ApiOperation({ summary: 'Get all shipments' })
  @ApiOkResponse({ type: [TrackerShipmentDto] })
  async getShipments(@Query('status') status?: string) {
    return this.trackerService.getShipments(status);
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiOkResponse({ type: TrackerShipmentDto })
  async getShipmentById(@Param('id') id: string) {
    return this.trackerService.getShipmentById(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tracker statistics' })
  @ApiOkResponse({ type: TrackerStatsDto })
  async getStats() {
    return this.trackerService.getStats();
  }

  @Get('relief-zones')
  @ApiOperation({ summary: 'Get relief zones' })
  @ApiOkResponse({ type: [TrackerReliefZoneDto] })
  async getReliefZones() {
    return this.trackerService.getReliefZones();
  }

  @Get('validators')
  @ApiOperation({ summary: 'Get validators' })
  @ApiOkResponse({ type: [TrackerValidatorDto] })
  async getValidators() {
    return this.trackerService.getValidators();
  }

  @Get('donation-distribution')
  @ApiOperation({ summary: 'Get donation distribution' })
  @ApiOkResponse({ type: Object, description: 'Map of category names to percentages' })
  async getDonationDistribution() {
    return this.trackerService.getDonationDistribution();
  }
}
