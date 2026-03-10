import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import {
    type AssistantAnswerInput,
    type AssistantAnswerResult,
    type DisasterAssistantProvider,
} from './assistant.provider';
import { SimpleAssistantProvider } from './simple-assistant.provider';
import { getLlmRuntimeConfig, type LlmRuntimeConfig } from '../../../config';

const MAX_RESPONSE_CHARS = 2000;

@Injectable()
export class FlaskAssistantProvider
    implements DisasterAssistantProvider, OnModuleInit {
    private readonly logger = new Logger(FlaskAssistantProvider.name);
    private config!: LlmRuntimeConfig;

    constructor(private readonly fallback: SimpleAssistantProvider) { }

    onModuleInit() {
        this.config = getLlmRuntimeConfig();
        this.logger.log(
            `LLM server configured at ${this.config.llmServerUrl} (timeout: ${this.config.llmTimeoutMs}ms)`,
        );
    }

    async answer(input: AssistantAnswerInput): Promise<AssistantAnswerResult> {
        const start = Date.now();

        try {
            const response = await axios.post(
                `${this.config.llmServerUrl}/api/chat`,
                {
                    question: input.question,
                    context: {
                        hazardType: input.context?.hazardType,
                        location: input.context?.location,
                    },
                },
                { timeout: this.config.llmTimeoutMs },
            );

            const elapsed = Date.now() - start;
            const provider = response.data?.provider ?? 'flask-llm';
            this.logger.log(
                `LLM response received in ${elapsed}ms (provider: ${provider})`,
            );

            const rawAnswer: string = response.data?.answer ?? '';
            const answer =
                rawAnswer.length > MAX_RESPONSE_CHARS
                    ? rawAnswer.slice(0, MAX_RESPONSE_CHARS) + '…'
                    : rawAnswer;

            return {
                answer,
                disclaimer:
                    response.data?.disclaimer ??
                    'This assistant provides general guidance only.',
                provider,
            };
        } catch (error) {
            const elapsed = Date.now() - start;
            this.logger.warn(
                `LLM server call failed after ${elapsed}ms, activating fallback. Error: ${error instanceof Error ? error.message : String(error)
                }`,
            );
            return this.fallback.answer(input);
        }
    }
}
