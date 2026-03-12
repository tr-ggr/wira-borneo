import { Injectable } from '@nestjs/common';

const DAMAGE_CATEGORIES = [
  'FLOODED_ROAD',
  'COLLAPSED_STRUCTURE',
  'DAMAGED_INFRASTRUCTURE',
] as const;

export type DamageCategory = (typeof DAMAGE_CATEGORIES)[number];

@Injectable()
export class DamageAnalysisService {
  async analyzeImage(_photoUrl: string): Promise<{
    damageCategories: DamageCategory[];
    confidenceScore: number;
  }> {
    // TODO: Replace with a real computer-vision model integration.
    const shuffled = [...DAMAGE_CATEGORIES].sort(() => Math.random() - 0.5);
    const count = Math.max(1, Math.floor(Math.random() * DAMAGE_CATEGORIES.length) + 1);
    const confidenceScore = Number((Math.random() * 0.99 + 0.01).toFixed(2));

    return {
      damageCategories: shuffled.slice(0, count),
      confidenceScore,
    };
  }
}