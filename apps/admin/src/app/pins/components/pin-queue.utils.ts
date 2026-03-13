export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ModerationFilter = 'ALL' | ModerationStatus;

export interface PinQueueLike {
  id: string;
  title?: string | null;
  note?: string | null;
  region?: string | null;
  reviewStatus?: ModerationStatus | null;
  reporter?: { name?: string | null } | null;
}

export function getPinModerationStatus(pin: Pick<PinQueueLike, 'reviewStatus'>): ModerationStatus {
  return pin.reviewStatus ?? 'PENDING';
}

export function countByModerationStatus<T extends Pick<PinQueueLike, 'reviewStatus'>>(
  pins: ReadonlyArray<T>,
): Record<ModerationStatus, number> {
  return pins.reduce(
    (counts, pin) => {
      const key = getPinModerationStatus(pin);
      counts[key] += 1;
      return counts;
    },
    {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    } satisfies Record<ModerationStatus, number>,
  );
}

export function filterPins<T extends PinQueueLike>(
  pins: ReadonlyArray<T>,
  statusFilter: ModerationFilter,
  query: string,
): T[] {
  const term = query.trim().toLowerCase();

  return pins
    .filter((pin) => (statusFilter === 'ALL' ? true : getPinModerationStatus(pin) === statusFilter))
    .filter((pin) => {
      if (!term) {
        return true;
      }

      return [
        pin.title,
        pin.note,
        pin.region,
        pin.reporter?.name,
        pin.id,
        pin.id.slice(-8),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
}
