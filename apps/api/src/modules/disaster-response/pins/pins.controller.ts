import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import type { AuthSession } from '../../auth/auth.types';
import { PinsService } from './pins.service';

const HAZARD_TYPES = ['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] as const;

class CreatePinDto {
  @ApiProperty({ description: 'Short title for the hazard pin' })
  title!: string;

  @ApiProperty({ enum: HAZARD_TYPES })
  hazardType!: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiPropertyOptional()
  note?: string;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  photoKey?: string;
}

function assertCreatePinDto(input: CreatePinDto): void {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  if (!input.title || typeof input.title !== 'string') {
    throw new BadRequestException('title is required and must be a string.');
  }

  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new BadRequestException('title cannot be empty.');
  }

  if (!HAZARD_TYPES.includes(input.hazardType as (typeof HAZARD_TYPES)[number])) {
    throw new BadRequestException(
      `hazardType must be one of: ${HAZARD_TYPES.join(', ')}.`,
    );
  }

  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  if (input.latitude == null || isNaN(lat) || lat < -90 || lat > 90) {
    throw new BadRequestException(
      'latitude is required and must be a number between -90 and 90.',
    );
  }
  if (input.longitude == null || isNaN(lng) || lng < -180 || lng > 180) {
    throw new BadRequestException(
      'longitude is required and must be a number between -180 and 180.',
    );
  }

  if (input.note != null && typeof input.note !== 'string') {
    throw new BadRequestException('note must be a string.');
  }

  const hasPhotoUrl = input.photoUrl != null && String(input.photoUrl).trim() !== '';
  const hasPhotoKey = input.photoKey != null && String(input.photoKey).trim() !== '';
  if (hasPhotoUrl !== hasPhotoKey) {
    throw new BadRequestException(
      'When providing photo, both photoUrl and photoKey must be set together.',
    );
  }
  if (input.photoUrl != null && typeof input.photoUrl !== 'string') {
    throw new BadRequestException('photoUrl must be a string.');
  }
  if (input.photoKey != null && typeof input.photoKey !== 'string') {
    throw new BadRequestException('photoKey must be a string.');
  }
}

@ApiTags('pins')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard)
@Controller('pins')
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a hazard pin with location and optional photo' })
  @ApiBody({ type: CreatePinDto })
  async create(
    @AuthSessionParam() session: AuthSession,
    @Body() body: CreatePinDto,
  ) {
    assertCreatePinDto(body);

    const lat = Number(body.latitude);
    const lng = Number(body.longitude);

    return this.pinsService.create({
      reporterId: session.user.id,
      title: body.title.trim(),
      hazardType: body.hazardType,
      latitude: lat,
      longitude: lng,
      note: body.note?.trim() || undefined,
      photoUrl: body.photoUrl?.trim() || undefined,
      photoKey: body.photoKey?.trim() || undefined,
    });
  }
}
