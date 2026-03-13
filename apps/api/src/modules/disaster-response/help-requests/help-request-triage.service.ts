import { Injectable, Logger } from '@nestjs/common';

const HUGGING_FACE_SPACE = 'tomasdanjo/sagip-needs-ticketing';
const HUGGING_FACE_ENDPOINT = '/infer';
const HUGGING_FACE_THRESHOLD = 0.85;

const PREDICTED_URGENCY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type PredictedUrgency = (typeof PREDICTED_URGENCY_VALUES)[number];

type InferencePayload = {
  predicted_urgency?: unknown;
  urgency_confidence?: unknown;
};

export type HelpRequestTriageResult = {
  predictedUrgency: PredictedUrgency;
  urgencyConfidence: number;
};

const LABEL_TO_URGENCY: Record<string, PredictedUrgency> = {
  INFRASTRUCTURE_DAMAGE: 'MEDIUM',
  RISING_FLOODWATERS: 'HIGH',
  MEDICAL_CRISIS: 'CRITICAL',
  TRAPPED_FAMILY: 'CRITICAL',
};

function normalizeUrgency(value: unknown): PredictedUrgency | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === 'MODERATE') {
    return 'MEDIUM';
  }

  if (LABEL_TO_URGENCY[normalized]) {
    return LABEL_TO_URGENCY[normalized];
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
  const seenStrings = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (typeof current === 'string') {
      const trimmed = current.trim();
      if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && !seenStrings.has(trimmed)) {
        try {
          seenStrings.add(trimmed);
          const parsed = JSON.parse(trimmed);
          queue.push(parsed);
        } catch {
          // Ignore invalid JSON strings
        }
      }
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

export function parseHelpRequestTriageResult(data: unknown): HelpRequestTriageResult | null {
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
  };
}

@Injectable()
export class HelpRequestTriageService {
  private readonly logger = new Logger(HelpRequestTriageService.name);
  private clientPromise: Promise<{
    predict: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>;
  }> | null = null;

  async triage(text: string): Promise<HelpRequestTriageResult | null> {
    try {
      const client = await this.getClient();
      const result = await client.predict(HUGGING_FACE_ENDPOINT, {
        text,
        threshold: HUGGING_FACE_THRESHOLD,
      });

      const data = (result as { data?: unknown } | null)?.data ?? result;
      const parsed = parseHelpRequestTriageResult(data);

      if (!parsed) {
        this.logger.warn('Unable to parse Hugging Face response schema for help request triage.');
        this.logger.warn(`Full response: ${JSON.stringify(result, null, 2)}`);
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        `Help request triage request failed. Proceeding without AI metadata. ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
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
