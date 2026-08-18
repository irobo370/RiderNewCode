export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export function decodePolyline(encoded: string | null | undefined): MapCoordinate[] {
  if (!encoded) return [];

  const points: MapCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export interface RegionFitOptions {
  /** Multiplier applied to the route bounding box (default 2.4). */
  paddingFactor?: number;
  /** Shift center south so the route sits above a bottom sheet (0–1, default 0.2). */
  bottomSheetOffset?: number;
}

export function regionFromCoordinates(
  coords: MapCoordinate[],
  options: RegionFitOptions = {},
) {
  if (!coords.length) return null;

  const paddingFactor = options.paddingFactor ?? 2.4;
  const bottomSheetOffset = options.bottomSheetOffset ?? 0.2;

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const coord of coords) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  }

  const latitudeDelta = Math.max((maxLat - minLat) * paddingFactor, 0.02);
  const longitudeDelta = Math.max((maxLng - minLng) * paddingFactor, 0.02);
  const centerLat = (minLat + maxLat) / 2;

  return {
    latitude: centerLat - latitudeDelta * bottomSheetOffset,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

export interface StreetLevelRegionOptions {
  bottomSheetOffset?: number;
  minDelta?: number;
  maxDelta?: number;
}

/** Tight map region for driver-at-pickup (roughly block / street level). */
export function streetLevelRegionFromCoords(
  coords: MapCoordinate[],
  options: StreetLevelRegionOptions = {},
) {
  if (!coords.length) return null;

  const minDelta = options.minDelta ?? 0.003;
  const maxDelta = options.maxDelta ?? 0.006;
  const bottomSheetOffset = options.bottomSheetOffset ?? 0.12;

  if (coords.length === 1) {
    return {
      latitude: coords[0].latitude - minDelta * bottomSheetOffset,
      longitude: coords[0].longitude,
      latitudeDelta: minDelta,
      longitudeDelta: minDelta,
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const coord of coords) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  }

  const latitudeDelta = Math.min(
    maxDelta,
    Math.max(minDelta, (maxLat - minLat) * 2.2 || minDelta),
  );
  const longitudeDelta = Math.min(
    maxDelta,
    Math.max(minDelta, (maxLng - minLng) * 2.2 || minDelta),
  );
  const centerLat = (minLat + maxLat) / 2;

  return {
    latitude: centerLat - latitudeDelta * bottomSheetOffset,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
