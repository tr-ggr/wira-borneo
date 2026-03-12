export interface SavedLocation {
  areaName: string;
  latitude: string;
  longitude: string;
  radiusKm: string;
  polygonGeoJson: string;
}

const STORAGE_KEY = 'wira_last_warning_location';

export function saveLastWarningLocation(location: SavedLocation): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Failed to save last warning location:', error);
  }
}

export function getLastWarningLocation(): SavedLocation | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as SavedLocation;
  } catch (error) {
    console.error('Failed to load last warning location:', error);
    return null;
  }
}

export function isLocationEmpty(location: SavedLocation): boolean {
  return !location.areaName && !location.latitude && !location.longitude;
}
