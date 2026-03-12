import { describe, expect, it } from 'vitest';
import { filterPinStatuses, filterRiskLayers } from './map-filters.utils';

describe('map-filters.utils', () => {
  it('filters hazard layers based on toggle state', () => {
    const input = [
      { hazardType: 'Flood', id: 1 },
      { hazardType: 'Typhoon', id: 2 },
      { hazardType: 'Aftershock', id: 3 },
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
      { status: 'Open', id: 'a' },
      { status: 'Blocked', id: 'b' },
      { status: 'Resolved', id: 'c' },
    ];

    const output = filterPinStatuses(input, {
      OPEN: true,
      BLOCKED: true,
      RESOLVED: false,
    });

    expect(output.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
