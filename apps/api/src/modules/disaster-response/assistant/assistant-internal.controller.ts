import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../../core/database/database.service';
import { getLlmRuntimeConfig } from '../../../config';

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

@ApiTags('assistant-internal')
@Controller('assistant/internal')
export class AssistantInternalController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('demographics/:userId')
  @ApiOperation({ summary: 'Internal: fetch user demographics for tool calling' })
  @ApiParam({ name: 'userId', required: true })
  async getDemographics(
    @Param('userId') userId: string,
    @Headers('x-llm-internal-secret') secret?: string,
  ) {
    const cfg = getLlmRuntimeConfig();
    if (!secret || secret !== cfg.llmInternalSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        age: true,
        housingType: true,
        personalInfo: true,
        vulnerabilities: true,
        householdComposition: true,
        emergencySkills: true,
        assets: true,
      },
    });

    const demographics = user
      ? {
          age: user.age,
          housingType: user.housingType,
          personalInfo: user.personalInfo,
          vulnerabilities: user.vulnerabilities,
          householdComposition: user.householdComposition,
          emergencySkills: user.emergencySkills,
          assets: user.assets,
        }
      : null;

    const missingFields: string[] = [];
    if (!demographics) {
      missingFields.push(
        'age',
        'housingType',
        'personalInfo',
        'vulnerabilities',
        'householdComposition',
        'emergencySkills',
        'assets',
      );
    } else {
      if (!isPresent(demographics.age)) missingFields.push('age');
      if (!isPresent(demographics.housingType)) missingFields.push('housingType');
      if (!isPresent(demographics.personalInfo)) missingFields.push('personalInfo');
      if (!isPresent(demographics.vulnerabilities)) missingFields.push('vulnerabilities');
      if (!isPresent(demographics.householdComposition))
        missingFields.push('householdComposition');
      if (!isPresent(demographics.emergencySkills)) missingFields.push('emergencySkills');
      if (!isPresent(demographics.assets)) missingFields.push('assets');
    }

    return {
      userId,
      demographics,
      profileComplete: missingFields.length === 0,
      missingFields,
    };
  }
}

