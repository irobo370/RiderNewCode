import { GOOGLE_MAPS_API_KEY } from "../constants/googleMaps";
import { decodePolyline, type MapCoordinate } from "./decodePolyline";

export type ManeuverType =
  | "turn-left"
  | "turn-right"
  | "turn-slight-left"
  | "turn-slight-right"
  | "turn-sharp-left"
  | "turn-sharp-right"
  | "uturn-left"
  | "uturn-right"
  | "straight"
  | "merge"
  | "ramp-left"
  | "ramp-right"
  | "fork-left"
  | "fork-right"
  | "roundabout-left"
  | "roundabout-right"
  | "arrive"
  | "depart";

export type RouteStep = {
  instruction: string;
  maneuver: ManeuverType;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
  start: MapCoordinate;
  end: MapCoordinate;
  coordinates: MapCoordinate[];
};

export type DrivingRoute = {
  coordinates: MapCoordinate[];
  steps: RouteStep[];
  distanceMeters: number;
  durationSeconds: number;
  durationInTrafficSeconds: number | null;
  summary: string;
  encodedPolyline: string | null;
};

export type DrivingRouteResult = {
  primary: DrivingRoute | null;
  alternatives: DrivingRoute[];
};

export type TrafficLevel = "clear" | "moderate" | "heavy";

export function trafficLevelForRoute(route: DrivingRoute | null): TrafficLevel {
  if (!route?.durationInTrafficSeconds || !route.durationSeconds) {
    return "clear";
  }
  const ratio = route.durationInTrafficSeconds / Math.max(1, route.durationSeconds);
  if (ratio >= 1.4) return "heavy";
  if (ratio >= 1.15) return "moderate";
  return "clear";
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeManeuver(raw: string | undefined): ManeuverType {
  const value = (raw ?? "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const known: ManeuverType[] = [
    "turn-left",
    "turn-right",
    "turn-slight-left",
    "turn-slight-right",
    "turn-sharp-left",
    "turn-sharp-right",
    "uturn-left",
    "uturn-right",
    "straight",
    "merge",
    "ramp-left",
    "ramp-right",
    "fork-left",
    "fork-right",
    "roundabout-left",
    "roundabout-right",
    "arrive",
    "depart",
  ];
  if (known.includes(value as ManeuverType)) return value as ManeuverType;
  if (value.includes("u-turn") || value.includes("uturn")) {
    return value.includes("right") ? "uturn-right" : "uturn-left";
  }
  if (value.includes("roundabout")) {
    return value.includes("right") ? "roundabout-right" : "roundabout-left";
  }
  if (value.includes("ramp")) {
    return value.includes("right") ? "ramp-right" : "ramp-left";
  }
  if (value.includes("fork")) {
    return value.includes("right") ? "fork-right" : "fork-left";
  }
  if (value.includes("merge")) return "merge";
  if (value.includes("left")) return "turn-left";
  if (value.includes("right")) return "turn-right";
  if (value.includes("arrive") || value.includes("destination")) return "arrive";
  if (value.includes("depart") || value.includes("start")) return "depart";
  return "straight";
}

function mergeCoordinates(parts: MapCoordinate[][]): MapCoordinate[] {
  const merged: MapCoordinate[] = [];
  for (const part of parts) {
    for (const coord of part) {
      const last = merged[merged.length - 1];
      if (
        last &&
        Math.abs(last.latitude - coord.latitude) < 1e-7 &&
        Math.abs(last.longitude - coord.longitude) < 1e-7
      ) {
        continue;
      }
      merged.push(coord);
    }
  }
  return merged;
}

function toLatLng(location: { lat?: number; lng?: number } | undefined): MapCoordinate {
  return {
    latitude: Number(location?.lat ?? 0),
    longitude: Number(location?.lng ?? 0),
  };
}

function parseGoogleRoute(route: any): DrivingRoute | null {
  const legs = Array.isArray(route?.legs) ? route.legs : [];
  const steps: RouteStep[] = [];
  const stepPolylines: MapCoordinate[][] = [];
  let distanceMeters = 0;
  let durationSeconds = 0;
  let durationInTrafficSeconds = 0;
  let hasTraffic = false;

  for (const leg of legs) {
    distanceMeters += Number(leg?.distance?.value ?? 0);
    durationSeconds += Number(leg?.duration?.value ?? 0);
    if (leg?.duration_in_traffic?.value != null) {
      durationInTrafficSeconds += Number(leg.duration_in_traffic.value);
      hasTraffic = true;
    }
    for (const step of leg?.steps ?? []) {
      const coordinates = decodePolyline(step?.polyline?.points);
      const instruction = stripHtml(String(step?.html_instructions ?? "Continue"));
      const streetName =
        instruction.split(" onto ")[1]?.split(" and ")[0] ??
        instruction.split(" on ")[1]?.split(" and ")[0] ??
        "";
      steps.push({
        instruction,
        maneuver: normalizeManeuver(step?.maneuver),
        distanceMeters: Number(step?.distance?.value ?? 0),
        durationSeconds: Number(step?.duration?.value ?? 0),
        streetName,
        start: toLatLng(step?.start_location),
        end: toLatLng(step?.end_location),
        coordinates,
      });
      if (coordinates.length) stepPolylines.push(coordinates);
    }
  }

  const fromSteps = mergeCoordinates(stepPolylines);
  const overview = decodePolyline(route?.overview_polyline?.points);
  const coordinates = fromSteps.length > overview.length ? fromSteps : overview;
  if (!coordinates.length) return null;

  return {
    coordinates,
    steps,
    distanceMeters,
    durationSeconds,
    durationInTrafficSeconds: hasTraffic ? durationInTrafficSeconds : null,
    summary: String(route?.summary ?? ""),
    encodedPolyline: route?.overview_polyline?.points ?? null,
  };
}

async function fetchGoogleDrivingRouteDetails(
  origin: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<DrivingRouteResult> {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: "driving",
    alternatives: "true",
    departure_time: "now",
    traffic_model: "best_guess",
    units: "metric",
    key: GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
    { signal },
  );
  if (!response.ok) return { primary: null, alternatives: [] };

  const json = await response.json();
  if (json?.status !== "OK" || !Array.isArray(json.routes)) {
    return { primary: null, alternatives: [] };
  }

  const parsed = json.routes
    .map(parseGoogleRoute)
    .filter((route): route is DrivingRoute => Boolean(route));

  return {
    primary: parsed[0] ?? null,
    alternatives: parsed.slice(1, 3),
  };
}

function osrmManeuver(step: any): ManeuverType {
  const type = String(step?.maneuver?.type ?? "");
  const modifier = String(step?.maneuver?.modifier ?? "");
  if (type === "arrive") return "arrive";
  if (type === "depart") return "depart";
  if (type === "merge") return "merge";
  return normalizeManeuver(`${type} ${modifier}`.trim());
}

function parseOsrmRoute(route: any): DrivingRoute | null {
  const coordinates = decodePolyline(route?.geometry);
  const steps: RouteStep[] = (route?.legs ?? []).flatMap((leg: any) =>
    (leg?.steps ?? []).map((step: any) => {
      const instruction =
        step?.maneuver?.instruction ||
        [step?.maneuver?.type, step?.maneuver?.modifier, step?.name]
          .filter(Boolean)
          .join(" ");
      return {
        instruction: stripHtml(String(instruction || "Continue")),
        maneuver: osrmManeuver(step),
        distanceMeters: Number(step?.distance ?? 0),
        durationSeconds: Number(step?.duration ?? 0),
        streetName: String(step?.name ?? ""),
        start: {
          latitude: Number(step?.maneuver?.location?.[1] ?? 0),
          longitude: Number(step?.maneuver?.location?.[0] ?? 0),
        },
        end: {
          latitude: Number(step?.maneuver?.location?.[1] ?? 0),
          longitude: Number(step?.maneuver?.location?.[0] ?? 0),
        },
        coordinates: decodePolyline(step?.geometry),
      } satisfies RouteStep;
    }),
  );

  if (!coordinates.length) return null;

  return {
    coordinates,
    steps,
    distanceMeters: Number(route?.distance ?? 0),
    durationSeconds: Number(route?.duration ?? 0),
    durationInTrafficSeconds: null,
    summary: String(route?.legs?.[0]?.summary ?? ""),
    encodedPolyline: route?.geometry ?? null,
  };
}

async function fetchOsrmDrivingRouteDetails(
  origin: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<DrivingRouteResult> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=polyline&steps=true&alternatives=true`;

  const response = await fetch(url, { signal });
  if (!response.ok) return { primary: null, alternatives: [] };

  const json = await response.json();
  if (json?.code !== "Ok" || !Array.isArray(json.routes)) {
    return { primary: null, alternatives: [] };
  }

  const parsed = json.routes
    .map(parseOsrmRoute)
    .filter((route): route is DrivingRoute => Boolean(route));

  return {
    primary: parsed[0] ?? null,
    alternatives: parsed.slice(1, 3),
  };
}

/**
 * Fetch a road-following driving route with turn-by-turn steps.
 * Tries Google Directions (traffic-aware) first, then OSRM.
 */
export async function fetchDrivingRouteDetails(
  origin: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<DrivingRouteResult> {
  try {
    const google = await fetchGoogleDrivingRouteDetails(origin, destination, signal);
    if (google.primary?.coordinates.length) return google;
  } catch {
    if (signal?.aborted) return { primary: null, alternatives: [] };
  }

  try {
    return await fetchOsrmDrivingRouteDetails(origin, destination, signal);
  } catch {
    return { primary: null, alternatives: [] };
  }
}

/**
 * Fetch a driving route between two points.
 * Tries Google Directions first, then OSRM. Returns [] if both fail.
 */
export async function fetchDrivingRoute(
  origin: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<MapCoordinate[]> {
  const result = await fetchDrivingRouteDetails(origin, destination, signal);
  return result.primary?.coordinates ?? [];
}
