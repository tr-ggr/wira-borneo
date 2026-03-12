export function withinRadiusKm(input: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  radiusKm: number;
}): boolean {
  const distance = haversineKm(
    input.fromLat,
    input.fromLng,
    input.toLat,
    input.toLng,
  );

  return distance <= input.radiusKm;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 * Points on the edge are considered inside.
 * @param lat - latitude of the point
 * @param lng - longitude of the point
 * @param ring - array of [lng, lat] coordinate pairs representing the polygon ring
 * @returns true if point is inside or on the polygon, false otherwise
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  ring: number[][],
): boolean {
  if (!ring || ring.length < 3) {
    return false;
  }

  // Check if point is on a vertex or edge (within tolerance)
  const tolerance = 1e-10;
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % ring.length];

    // Check if point is exactly at this vertex
    if (Math.abs(lat - p1[1]) < tolerance && Math.abs(lng - p1[0]) < tolerance) {
      return true;
    }

    // Check if point is on the edge between this vertex and the next
    const x1 = p1[0];
    const y1 = p1[1];
    const x2 = p2[0];
    const y2 = p2[1];

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    if (lng >= minX && lng <= maxX && lat >= minY && lat <= maxY) {
      // Point is within bounding box of edge, check if on the line
      const crossproduct =
        (lat - y1) * (x2 - x1) - (lng - x1) * (y2 - y1);
      if (Math.abs(crossproduct) < tolerance) {
        return true;
      }
    }
  }

  // Ray-casting algorithm for interior points
  let isInside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }

  return isInside;
}

/**
 * Check if a point is inside a GeoJSON polygon geometry.
 * Supports both Polygon and MultiPolygon geometries.
 * @param lat - latitude of the point
 * @param lng - longitude of the point
 * @param geoJsonStr - GeoJSON geometry as a string
 * @returns true if point is inside any polygon, false otherwise
 */
export function isInsideGeoJsonPolygon(
  lat: number,
  lng: number,
  geoJsonStr: string,
): boolean {
  try {
    if (!geoJsonStr || typeof geoJsonStr !== 'string') {
      return false;
    }

    const geometry = JSON.parse(geoJsonStr);

    if (!geometry || !geometry.type) {
      return false;
    }

    // Handle Polygon type: coordinates is [ring1, ring2, ...]
    // ring[0] is outer boundary, ring[1+] are holes
    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
      const rings = geometry.coordinates;
      
      // Check if inside the outer ring (first ring)
      if (rings.length > 0 && pointInPolygon(lat, lng, rings[0])) {
        // If inside outer ring, check if inside any holes
        for (let i = 1; i < rings.length; i++) {
          if (pointInPolygon(lat, lng, rings[i])) {
            return false; // Inside a hole, so outside the polygon
          }
        }
        return true; // Inside outer ring and no holes
      }
      return false;
    }

    // Handle MultiPolygon type: coordinates is [[ring1, ring2, ...], [ring1, ring2, ...], ...]
    if (
      geometry.type === 'MultiPolygon' &&
      Array.isArray(geometry.coordinates)
    ) {
      for (const polygon of geometry.coordinates) {
        if (Array.isArray(polygon) && polygon.length > 0) {
          // Check if inside this polygon's outer ring
          if (pointInPolygon(lat, lng, polygon[0])) {
            // Check if inside any holes of this polygon
            let inHole = false;
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(lat, lng, polygon[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) {
              return true;
            }
          }
        }
      }
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error parsing GeoJSON for point-in-polygon check:', error);
    return false;
  }
}
