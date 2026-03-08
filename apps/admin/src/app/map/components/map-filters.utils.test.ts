import { describe, expect, it } from 'vitest';
import { filterPinStatuses, filterRiskLayers } from './map-filters.utils';

describe('map-filters.utils', () => {
  it('filters hazard layers based on toggle state', () => {
    const input = [
      { hazardType: 'FLOOD', id: 1 },
      { hazardType: 'TYPHOON', id: 2 },
      { hazardType: 'AFTERSHOCK', id: 3 },
    ];

    const output = filterRiskLayers(input, {
      FLOOD: true,
      TYPHOON: false,
      AFTERSHOCK: true,
    });

    expect(output.map((item) => item.id)).toEqual([1, 3]);
  });

  it('filters pins by selected statuses', () => {
    const input = [
      { status: 'OPEN', id: 'a' },
      { status: 'BLOCKED', id: 'b' },
      { status: 'RESOLVED', id: 'c' },
    ];

    const output = filterPinStatuses(input, {
      OPEN: true,
      BLOCKED: true,
      RESOLVED: false,
    });

    expect(output.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
