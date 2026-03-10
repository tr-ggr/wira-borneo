import { Injectable } from '@nestjs/common';
import { FlaskAssistantProvider } from './flask-assistant.provider';

@Injectable()
export class AssistantService {
  constructor(private readonly provider: FlaskAssistantProvider) { }

  async answerInquiry(input: {
    question: string;
    location?: string;
    hazardType?: string;
  }) {
    // The assistant is informational only and cannot mutate operational state.
    return this.provider.answer({
      question: input.question,
      context: {
        location: input.location,
        hazardType: input.hazardType,
      },
    });
  }
}
