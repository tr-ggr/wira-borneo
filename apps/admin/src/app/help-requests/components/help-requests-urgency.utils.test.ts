import { describe, expect, it } from 'vitest';
import {
  formatUrgencyConfidence,
  getEffectiveUrgency,
  getUrgencyPaletteClasses,
} from './help-requests-urgency.utils';

describe('help-requests-urgency.utils', () => {
  it('prefers predicted urgency when available', () => {
    expect(getEffectiveUrgency({ urgency: 'MEDIUM', predictedUrgency: 'CRITICAL' })).toBe('CRITICAL');
  });

  it('falls back to submitted urgency when predicted urgency is null', () => {
    expect(getEffectiveUrgency({ urgency: 'HIGH', predictedUrgency: null })).toBe('HIGH');
  });

  it('returns stable palette classes for urgency levels', () => {
    expect(getUrgencyPaletteClasses('LOW').badge).toContain('slate');
    expect(getUrgencyPaletteClasses('MEDIUM').badge).toContain('amber');
    expect(getUrgencyPaletteClasses('HIGH').badge).toContain('orange');
    expect(getUrgencyPaletteClasses('CRITICAL').badge).toContain('rose');
  });

  it('formats confidence as percentage and handles null gracefully', () => {
    expect(formatUrgencyConfidence(0.873)).toBe('87%');
    expect(formatUrgencyConfidence(2)).toBe('100%');
    expect(formatUrgencyConfidence(-1)).toBe('0%');
    expect(formatUrgencyConfidence(null)).toBeNull();
  });
});
