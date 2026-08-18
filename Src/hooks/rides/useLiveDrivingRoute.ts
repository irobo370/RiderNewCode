import { useEffect, useRef, useState } from "react";
import type { MapCoordinate } from "../../utils/decodePolyline";
import { decodePolyline } from "../../utils/decodePolyline";
import {
  fetchDrivingRouteDetails,
  type DrivingRoute,
} from "../../utils/googleDirections";
import { isOffRoute } from "../../utils/navigationGeometry";

type UseLiveDrivingRouteArgs = {
  origin: MapCoordinate | null;
  destination: MapCoordinate | null;
  encodedFallback?: string | null;
  enabled?: boolean;
};

const REROUTE_COOLDOWN_MS = 12000;

export function useLiveDrivingRoute({
  origin,
  destination,
  encodedFallback,
  enabled = true,
}: UseLiveDrivingRouteArgs) {
  const [primary, setPrimary] = useState<DrivingRoute | null>(null);
  const [alternatives, setAlternatives] = useState<DrivingRoute[]>([]);
  const lastFetchRef = useRef(0);
  const originKey = origin
    ? `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`
    : "";
  const destKey = destination
    ? `${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`
    : "";

  useEffect(() => {
    if (!enabled || !origin || !destination) {
      setPrimary(null);
      setAlternatives([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    fetchDrivingRouteDetails(origin, destination, controller.signal)
      .then((result) => {
        if (cancelled) return;
        if (result.primary) {
          setPrimary(result.primary);
          setAlternatives(result.alternatives);
          lastFetchRef.current = Date.now();
          return;
        }

        const fallbackCoords = decodePolyline(encodedFallback);
        if (fallbackCoords.length > 1) {
          setPrimary({
            coordinates: fallbackCoords,
            steps: [],
            distanceMeters: 0,
            durationSeconds: 0,
            durationInTrafficSeconds: null,
            summary: "",
            encodedPolyline: encodedFallback ?? null,
          });
          setAlternatives([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackCoords = decodePolyline(encodedFallback);
        if (fallbackCoords.length > 1) {
          setPrimary({
            coordinates: fallbackCoords,
            steps: [],
            distanceMeters: 0,
            durationSeconds: 0,
            durationInTrafficSeconds: null,
            summary: "",
            encodedPolyline: encodedFallback ?? null,
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, originKey, destKey, encodedFallback]);

  useEffect(() => {
    if (!enabled || !origin || !destination || !primary?.coordinates.length) {
      return;
    }
    if (!isOffRoute(origin, primary.coordinates)) return;
    if (Date.now() - lastFetchRef.current < REROUTE_COOLDOWN_MS) return;

    const controller = new AbortController();
    lastFetchRef.current = Date.now();
    fetchDrivingRouteDetails(origin, destination, controller.signal)
      .then((result) => {
        if (result.primary) {
          setPrimary(result.primary);
          setAlternatives(result.alternatives);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [enabled, origin?.latitude, origin?.longitude, destKey, primary?.encodedPolyline]);

  return { primary, alternatives };
}
