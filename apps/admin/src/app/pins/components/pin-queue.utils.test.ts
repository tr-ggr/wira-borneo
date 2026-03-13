import { describe, expect, it } from 'vitest';
import { countByModerationStatus, filterPins, getPinModerationStatus } from './pin-queue.utils';

describe('pin-queue.utils', () => {
  const seed = [
    {
      id: 'pin-001',
      title: 'Flooded street',
      note: 'Water above knee level',
      region: 'Kota Kinabalu',
      reporter: { name: 'Aisyah' },
      reviewStatus: 'PENDING' as const,
    },
    {
      id: 'pin-002',
      title: 'Downed power line',
      note: 'Near market road',
      region: 'Sandakan',
      reporter: { name: 'Ravi' },
      reviewStatus: 'APPROVED' as const,
    },
    {
      id: 'pin-003',
      title: 'Landslide alert',
      note: 'Debris on the side lane',
      region: 'Tawau',
      reporter: { name: 'Ibrahim' },
      reviewStatus: null,
    },
  ];

  it('defaults null review status to pending', () => {
    expect(getPinModerationStatus({ reviewStatus: null })).toBe('PENDING');
  });

  it('counts moderation buckets including null as pending', () => {
    expect(countByModerationStatus(seed)).toEqual({
      PENDING: 2,
      APPROVED: 1,
      REJECTED: 0,
    });
  });

  it('filters by status and search term', () => {
    const filtered = filterPins(seed, 'APPROVED', 'market');
    expect(filtered.map((item) => item.id)).toEqual(['pin-002']);
  });
});
