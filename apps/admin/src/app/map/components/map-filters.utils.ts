export interface RegionRiskLike {
  hazardType: string;
}

export interface PinStatusLike {
  status: string;
}

export interface UserLocationLike {
  updatedAt?: string;
}

export function filterRiskLayers<T extends RegionRiskLike>(
  items: T[],
  enabledHazards: Record<string, boolean>,
): T[] {
  return items.filter((item) => Boolean(enabledHazards[item.hazardType]));
}

export function filterPinStatuses<T extends PinStatusLike>(
  items: T[],
  enabledStatuses: Record<string, boolean>,
): T[] {
  return items.filter((item) => Boolean(enabledStatuses[item.status]));
}

export function isLocationStale(updatedAt?: string, staleHours = 6): boolean {
  if (!updatedAt) {
    return true;
  }

  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) {
    return true;
  }

  const elapsedMs = Date.now() - timestamp;
  return elapsedMs > staleHours * 60 * 60 * 1000;
}

export function filterUserLocations<T extends UserLocationLike>(
  items: T[],
  enabledRecency: Record<string, boolean>,
): T[] {
  return items.filter((item) => {
    const stale = isLocationStale(item.updatedAt);
    return stale ? Boolean(enabledRecency.STALE) : Boolean(enabledRecency.RECENT);
  });
}
