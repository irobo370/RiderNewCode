import type { MapCoordinate } from "./decodePolyline";

const EARTH_RADIUS_M = 6371000;
const OFF_ROUTE_THRESHOLD_M = 70;

export function haversineMeters(a: MapCoordinate, b: MapCoordinate): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass heading in degrees (0 = north, clockwise). */
export function bearingDegrees(from: MapCoordinate, to: MapCoordinate): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  const km = meters / 1000;
  return `${km >= 10 ? km.toFixed(0) : km.toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
}

export function formatClockTime(fromNowSeconds: number): string {
  const date = new Date(Date.now() + Math.max(0, fromNowSeconds) * 1000);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function projectOnSegment(
  point: MapCoordinate,
  start: MapCoordinate,
  end: MapCoordinate,
) {
  const x = point.longitude;
  const y = point.latitude;
  const x1 = start.longitude;
  const y1 = start.latitude;
  const x2 = end.longitude;
  const y2 = end.latitude;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
  return {
    coordinate: {
      latitude: y1 + t * dy,
      longitude: x1 + t * dx,
    },
    t,
  };
}

export type NearestRoutePoint = {
  coordinate: MapCoordinate;
  segmentIndex: number;
  distanceMeters: number;
};

export function nearestPointOnRoute(
  point: MapCoordinate,
  route: MapCoordinate[],
): NearestRoutePoint | null {
  if (route.length === 0) return null;
  if (route.length === 1) {
    return {
      coordinate: route[0],
      segmentIndex: 0,
      distanceMeters: haversineMeters(point, route[0]),
    };
  }

  let best: NearestRoutePoint | null = null;

  for (let i = 0; i < route.length - 1; i += 1) {
    const projected = projectOnSegment(point, route[i], route[i + 1]);
    const distanceMeters = haversineMeters(point, projected.coordinate);
    if (!best || distanceMeters < best.distanceMeters) {
      best = {
        coordinate: projected.coordinate,
        segmentIndex: i,
        distanceMeters,
      };
    }
  }

  return best;
}

export function remainingDistanceAlongRoute(
  route: MapCoordinate[],
  fromIndex: number,
  fromPoint: MapCoordinate,
): number {
  if (route.length < 2) return 0;
  let meters = 0;
  const start = Math.min(fromIndex + 1, route.length - 1);
  meters += haversineMeters(fromPoint, route[start]);
  for (let i = start; i < route.length - 1; i += 1) {
    meters += haversineMeters(route[i], route[i + 1]);
  }
  return meters;
}

export function traveledDistanceAlongRoute(
  route: MapCoordinate[],
  toIndex: number,
  toPoint: MapCoordinate,
): number {
  if (route.length < 2) return 0;
  let meters = 0;
  for (let i = 0; i < toIndex; i += 1) {
    meters += haversineMeters(route[i], route[i + 1]);
  }
  meters += haversineMeters(route[toIndex], toPoint);
  return meters;
}

export function totalRouteDistance(route: MapCoordinate[]): number {
  let meters = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    meters += haversineMeters(route[i], route[i + 1]);
  }
  return meters;
}

export function isOffRoute(
  point: MapCoordinate,
  route: MapCoordinate[],
  thresholdMeters = OFF_ROUTE_THRESHOLD_M,
): boolean {
  const nearest = nearestPointOnRoute(point, route);
  if (!nearest) return false;
  return nearest.distanceMeters > thresholdMeters;
}

export function splitTraveledAndRemaining(
  route: MapCoordinate[],
  point: MapCoordinate,
): { traveled: MapCoordinate[]; remaining: MapCoordinate[] } {
  const nearest = nearestPointOnRoute(point, route);
  if (!nearest || route.length < 2) {
    return { traveled: [], remaining: route };
  }

  const traveled = [...route.slice(0, nearest.segmentIndex + 1), nearest.coordinate];
  const remaining = [nearest.coordinate, ...route.slice(nearest.segmentIndex + 1)];
  return { traveled, remaining };
}

export function headingAlongRoute(
  route: MapCoordinate[],
  fromIndex: number,
): number | null {
  if (route.length < 2) return null;
  const start = Math.min(fromIndex, route.length - 2);
  return bearingDegrees(route[start], route[start + 1]);
}
