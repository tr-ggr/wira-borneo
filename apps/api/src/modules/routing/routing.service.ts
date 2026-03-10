const OSRM_BASE_URL = 'https://router.project-osrm.org';
const VALID_VEHICLE_TYPES = ['driving', 'walking', 'cycling'] as const;

export interface RouteResult {
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  durationSeconds: number;
  distanceMeters: number;
}

export class RoutingService {
  async getRoute(
    fromLon: number,
    fromLat: number,
    toLon: number,
    toLat: number,
    vehicleType: string = 'driving',
  ): Promise<RouteResult | null> {
    if (!VALID_VEHICLE_TYPES.includes(vehicleType as (typeof VALID_VEHICLE_TYPES)[number])) {
      throw new Error(`Invalid vehicleType. Must be one of: ${VALID_VEHICLE_TYPES.join(', ')}`);
    }
    const coords = `${fromLon},${fromLat};${toLon},${toLat}`;
    const url = `${OSRM_BASE_URL}/route/v1/${vehicleType}/${coords}?geometries=geojson&overview=full`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        geometry?: { coordinates: [number, number][] };
        duration?: number;
        distance?: number;
      }>;
    };
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      geometry: {
        type: 'LineString',
        coordinates: route.geometry?.coordinates ?? [],
      },
      durationSeconds: route.duration ?? 0,
      distanceMeters: route.distance ?? 0,
    };
  }
}
