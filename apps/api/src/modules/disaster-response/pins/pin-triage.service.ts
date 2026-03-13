import { Injectable, Logger } from '@nestjs/common';

const HUGGING_FACE_SPACE = 'tomasdanjo/sagip-needs-ticketing';
const HUGGING_FACE_ENDPOINT = '/infer';
const HUGGING_FACE_THRESHOLD = 0.85;

const PREDICTED_URGENCY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type PredictedUrgency = (typeof PREDICTED_URGENCY_VALUES)[number];

export type PinTriageResult = {
  predictedUrgency: PredictedUrgency;
  urgencyConfidence: number;
  summary: string;
};

type InferencePayload = {
  predicted_urgency?: unknown;
  urgency_confidence?: unknown;
  summary?: unknown;
};

function normalizeUrgency(value: unknown): PredictedUrgency | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === 'MODERATE') {
    return 'MEDIUM';
  }

  return PREDICTED_URGENCY_VALUES.includes(normalized as PredictedUrgency)
    ? (normalized as PredictedUrgency)
    : null;
}

function normalizeConfidence(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : NaN;

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(1, Math.max(0, parsed));
}

function findInferencePayload(value: unknown): InferencePayload | null {
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current !== 'object') {
      continue;
    }

    const candidate = current as InferencePayload & Record<string, unknown>;
    const hasUrgency = Object.prototype.hasOwnProperty.call(candidate, 'predicted_urgency');
    const hasConfidence = Object.prototype.hasOwnProperty.call(candidate, 'urgency_confidence');

    if (hasUrgency || hasConfidence) {
      return candidate;
    }

    if (Object.prototype.hasOwnProperty.call(candidate, 'data')) {
      queue.push(candidate.data);
    }
    if (Object.prototype.hasOwnProperty.call(candidate, 'result')) {
      queue.push(candidate.result);
    }
    if (Object.prototype.hasOwnProperty.call(candidate, 'output')) {
      queue.push(candidate.output);
    }
    if (Object.prototype.hasOwnProperty.call(candidate, 'prediction')) {
      queue.push(candidate.prediction);
    }
    if (Object.prototype.hasOwnProperty.call(candidate, 'predictions')) {
      queue.push(candidate.predictions);
    }
  }

  return null;
}

export function parsePinTriageResult(data: unknown): PinTriageResult | null {
  const payload = findInferencePayload(data);

  if (!payload) {
    return null;
  }

  const predictedUrgency = normalizeUrgency(payload.predicted_urgency);
  const urgencyConfidence = normalizeConfidence(payload.urgency_confidence);

  if (!predictedUrgency || urgencyConfidence == null) {
    return null;
  }

  return {
    predictedUrgency,
    urgencyConfidence,
    summary: typeof payload.summary === 'string' ? payload.summary.trim() : '',
  };
}

@Injectable()
export class PinTriageService {
  private readonly logger = new Logger(PinTriageService.name);
  private clientPromise: Promise<{
    predict: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>;
  }> | null = null;

  async triage(input: {
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    title: string;
    note?: string;
  }): Promise<PinTriageResult | null> {
    try {
      const client = await this.getClient();
      const text = this.buildText(input);
      const result = await client.predict(HUGGING_FACE_ENDPOINT, {
        text,
        threshold: HUGGING_FACE_THRESHOLD,
      });

      const data = (result as { data?: unknown } | null)?.data ?? result;
      const parsed = parsePinTriageResult(data);

      if (!parsed) {
        this.logger.warn('Unable to parse Hugging Face response schema for hazard pin triage.');
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        `Hazard pin triage request failed. Falling back to pending review. ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private buildText(input: {
    hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
    title: string;
    note?: string;
  }): string {
    return [
      `Hazard Type: ${input.hazardType}`,
      `Title: ${input.title}`,
      `Note: ${input.note?.trim() || 'N/A'}`,
    ].join('\n');
  }

  private async getClient(): Promise<{
    predict: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>;
  }> {
    if (!this.clientPromise) {
      const gradio = await import('@gradio/client');
      this.clientPromise = gradio.Client.connect(HUGGING_FACE_SPACE);
    }

    return this.clientPromise;
  }
}
