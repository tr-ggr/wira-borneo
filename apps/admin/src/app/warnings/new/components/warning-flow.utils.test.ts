import { describe, expect, it } from 'vitest';
import {
  canProceedToConfirmation,
  warningFlowReducer,
  warningSummary,
} from './warning-flow.utils';

describe('warning-flow.utils', () => {
  it('requires title, message, and area before confirmation', () => {
    expect(
      canProceedToConfirmation({
        title: 'Flood warning',
        message: 'Move to higher ground',
        areaName: 'Kuching Selatan',
      }),
    ).toBe(true);

    expect(
      canProceedToConfirmation({
        title: '',
        message: 'Move to higher ground',
        areaName: 'Kuching Selatan',
      }),
    ).toBe(false);
  });

  it('returns to compose step on cancel to prevent sending', () => {
    expect(warningFlowReducer('confirm', { type: 'CANCEL' })).toBe('compose');
  });

  it('returns to compose after successful send confirmation', () => {
    expect(warningFlowReducer('confirm', { type: 'SENT' })).toBe('compose');
  });

  it('builds readable summary payload', () => {
    expect(
      warningSummary({
        title: 'Taufan Kritikal',
        message: 'Evacuate now',
        areaName: 'Sibu',
        radiusKm: 12,
        evacuationCount: 3,
      }),
    ).toEqual({
      heading: 'Taufan Kritikal',
      body: 'Evacuate now',
      target: 'Sibu (12 km)',
      evacuationCount: 3,
    });
  });
});
