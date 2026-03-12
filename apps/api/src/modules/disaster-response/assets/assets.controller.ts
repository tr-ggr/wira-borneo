import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';

class CreateAssetDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: Number })
  latitude?: number | string;

  @ApiPropertyOptional({ type: Number })
  longitude?: number | string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  photo?: any;
}

function parseOptionalNumber(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new BadRequestException(`${fieldName} must be a valid number`);
  }

  return parsed;
}

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new asset (e.g. vehicle, equipment)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAssetDto })
  @UseInterceptors(FileInterceptor('photo'))
  async createAsset(
    @Body() input: CreateAssetDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new FileTypeValidator({ fileType: /^image\// })],
      }),
    )
    photo: Express.Multer.File | undefined,
    @Query('userId') userId: string,
  ) {
    return this.assetsService.createAsset(
      userId,
      {
        name: input.name,
        description: input.description,
        latitude: parseOptionalNumber(input.latitude, 'latitude'),
        longitude: parseOptionalNumber(input.longitude, 'longitude'),
      },
      photo,
    );
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
