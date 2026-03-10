import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthSessionParam } from '../../auth/auth-session.decorator';
import { AssistantService } from './assistant.service';

import { ApiProperty } from '@nestjs/swagger';

class AssistantInquiryDto {
  @ApiProperty({
    example: 'What should I do during a flood?',
    description: 'User question (max 500 chars)',
  })
  question!: string;

  @ApiProperty({
    example: 'Kuching',
    required: false,
    description: 'Current location of the user',
  })
  location?: string;

  @ApiProperty({
    example: 'FLOOD',
    required: false,
    description: 'Type of hazard relevant to the inquiry',
  })
  hazardType?: string;
}

export class AssistantStructuredDataDto {
  @ApiProperty({
    example: 'Move to higher ground immediately.',
    description: 'Brief summary of advice',
  })
  summary!: string;

  @ApiProperty({
    type: [String],
    example: ['Pack a go bag', 'Listen to radio'],
    description: 'Actionable steps',
  })
  steps!: string[];

  @ApiProperty({
    example: 'Stay clear of power lines.',
    description: 'Safety reminder',
  })
  safetyReminder!: string;
}

class AssistantInquiryResponseDto {
  @ApiProperty({
    example: 'Move to higher ground immediately.',
    description: 'AI-generated answer to the inquiry',
  })
  answer!: string;

  @ApiProperty({
    example: 'This is general guidance only. Always follow local authorities.',
    description: 'Disclaimer regarding AI-generated content',
  })
  disclaimer!: string;

  @ApiProperty({
    example: 'sea-lion',
    description: 'The LLM provider that generated the response',
  })
  provider!: string;

  @ApiProperty({
    type: AssistantStructuredDataDto,
    required: false,
    description: 'Structured formulation of the advice',
  })
  structuredData?: AssistantStructuredDataDto;
}

// Simple in-memory per-user rate limiter (max requests per window)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const userRequestMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (userRequestMap.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    userRequestMap.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  userRequestMap.set(userId, timestamps);
  return false;
}

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(AuthSessionGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) { }

  @Post('inquiries')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ask disaster preparedness assistant' })
  @ApiOkResponse({ type: AssistantInquiryResponseDto })
  @ApiBody({ type: AssistantInquiryDto })
  async inquire(
    @AuthSessionParam() session: { user: { id: string } },
    @Body() body: AssistantInquiryDto,
  ): Promise<AssistantInquiryResponseDto> {
    // Input validation
    const question = body.question?.trim();
    if (!question) {
      throw new BadRequestException('question is required');
    }
    if (question.length > 500) {
      throw new BadRequestException('question must be ≤ 500 characters');
    }

    // Per-user rate limiting
    if (isRateLimited(session.user.id)) {
      throw new BadRequestException(
        'Too many requests. Please wait a moment before asking again.',
      );
    }

    return this.assistantService.answerInquiry({
      userId: session.user.id,
      question,
      location: body.location,
      hazardType: body.hazardType,
    });
  }
}
