export interface RegionRiskLike {
  hazardType: string;
}

export interface PinStatusLike {
  status: string;
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
