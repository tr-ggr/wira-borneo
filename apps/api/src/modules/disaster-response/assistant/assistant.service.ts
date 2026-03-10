import { Inject, Injectable } from '@nestjs/common';
import { type DisasterAssistantProvider } from './assistant.provider';

@Injectable()
export class AssistantService {
  constructor(
    @Inject('DisasterAssistantProvider')
    private readonly provider: DisasterAssistantProvider,
  ) { }

  async answerInquiry(input: {
    userId: string;
    question: string;
    location?: string;
    hazardType?: string;
  }) {
    return this.provider.answer({
      question: input.question,
      context: {
        location: input.location,
        hazardType: input.hazardType,
        userId: input.userId,
        // NOTE: demographics are intentionally *not* sent inline when tool calling is enabled.
        // The LLM should call get_user_demographics to retrieve this from the User table.
      },
    });
  }
}
