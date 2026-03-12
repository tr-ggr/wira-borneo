import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ApiTags, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateAssetDto {
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  description?: string;
  @ApiPropertyOptional()
  photoUrl?: string;
  @ApiPropertyOptional()
  latitude?: number;
  @ApiPropertyOptional()
  longitude?: number;
}

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new asset (e.g. vehicle, equipment)' })
  async createAsset(
    @Body() input: CreateAssetDto,
    @Query('userId') userId: string,
  ) {
    return this.assetsService.createAsset(userId, input);
  }

  @Get('my')
  @ApiOperation({ summary: 'List assets registered by the current user' })
  async listMyAssets(@Query('userId') userId: string) {
    return this.assetsService.listMyAssets(userId);
  }

  @Get('registry')
  @ApiOperation({ summary: 'List all approved assets for disaster response' })
  async listApprovedAssets() {
    return this.assetsService.listApprovedAssets();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset details' })
  async getAsset(@Param('id') id: string) {
    return this.assetsService.getAsset(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  async deleteAsset(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.assetsService.deleteAsset(userId, id);
  }
}
