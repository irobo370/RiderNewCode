import { useMemo } from "react";
import type { MapCoordinate } from "../../utils/decodePolyline";
import type { DrivingRoute, RouteStep } from "../../utils/googleDirections";
import {
  formatClockTime,
  formatDistance,
  formatDuration,
  headingAlongRoute,
  nearestPointOnRoute,
  remainingDistanceAlongRoute,
  totalRouteDistance,
  traveledDistanceAlongRoute,
} from "../../utils/navigationGeometry";

export type TurnByTurnState = {
  currentStep: RouteStep | null;
  nextInstruction: string;
  distanceToTurnLabel: string;
  distanceToTurnMeters: number;
  streetName: string;
  remainingDistanceLabel: string;
  remainingDurationLabel: string;
  etaClock: string;
  progress: number;
  heading: number | null;
  remainingCoordinates: MapCoordinate[];
  traveledCoordinates: MapCoordinate[];
};

const EMPTY_STATE: TurnByTurnState = {
  currentStep: null,
  nextInstruction: "Continue",
  distanceToTurnLabel: "—",
  distanceToTurnMeters: 0,
  streetName: "",
  remainingDistanceLabel: "—",
  remainingDurationLabel: "—",
  etaClock: "",
  progress: 0,
  heading: null,
  remainingCoordinates: [],
  traveledCoordinates: [],
};

function stepAtTraveled(
  steps: RouteStep[],
  traveledMeters: number,
): { step: RouteStep; distanceToTurn: number } | null {
  if (!steps.length) return null;
  let traveled = 0;
  for (const step of steps) {
    const end = traveled + step.distanceMeters;
    if (traveledMeters <= end) {
      return { step, distanceToTurn: Math.max(0, end - traveledMeters) };
    }
    traveled = end;
  }
  const last = steps[steps.length - 1];
  return { step: last, distanceToTurn: 0 };
}

export function useTurnByTurn(
  route: DrivingRoute | null,
  currentPosition: MapCoordinate | null,
): TurnByTurnState {
  return useMemo(() => {
    if (!route?.coordinates.length) return EMPTY_STATE;

    const position = currentPosition ?? route.coordinates[0];
    const nearest = nearestPointOnRoute(position, route.coordinates);
    if (!nearest) return { ...EMPTY_STATE, remainingCoordinates: route.coordinates };

    const remainingMeters = remainingDistanceAlongRoute(
      route.coordinates,
      nearest.segmentIndex,
      nearest.coordinate,
    );
    const traveledMeters = traveledDistanceAlongRoute(
      route.coordinates,
      nearest.segmentIndex,
      nearest.coordinate,
    );
    const totalMeters = Math.max(1, route.distanceMeters || totalRouteDistance(route.coordinates));
    const progress = Math.max(0, Math.min(1, traveledMeters / totalMeters));
    const remainingRatio = remainingMeters / totalMeters;
    const remainingSeconds = Math.round(
      (route.durationInTrafficSeconds ?? route.durationSeconds) * remainingRatio,
    );

    const stepState = stepAtTraveled(route.steps, traveledMeters);
    const currentStep = stepState?.step ?? null;
    const distanceToTurnMeters = stepState?.distanceToTurn ?? remainingMeters;
    const remainingCoordinates = [
      nearest.coordinate,
      ...route.coordinates.slice(nearest.segmentIndex + 1),
    ];
    const traveledCoordinates = [
      ...route.coordinates.slice(0, nearest.segmentIndex + 1),
      nearest.coordinate,
    ];

    return {
      currentStep,
      nextInstruction: currentStep?.instruction || "Continue straight",
      distanceToTurnLabel: formatDistance(distanceToTurnMeters),
      distanceToTurnMeters,
      streetName: currentStep?.streetName || route.summary || "",
      remainingDistanceLabel: formatDistance(remainingMeters),
      remainingDurationLabel: formatDuration(remainingSeconds),
      etaClock: formatClockTime(remainingSeconds),
      progress,
      heading:
        headingAlongRoute(route.coordinates, nearest.segmentIndex) ??
        null,
      remainingCoordinates,
      traveledCoordinates,
    };
  }, [route, currentPosition?.latitude, currentPosition?.longitude]);
}
