import React from "react";
import { Polyline } from "react-native-maps";
import type { MapCoordinate } from "../../utils/decodePolyline";
import { COLORS } from "../../utils/colors";

type RouteKind = "active" | "traveled" | "alternative";

type RoutePolylineProps = {
  coordinates: MapCoordinate[];
  kind?: RouteKind;
  strokeWidth?: number;
};

const STROKE: Record<RouteKind, string> = {
  active: COLORS.routeActive,
  traveled: COLORS.routeTraveled,
  alternative: COLORS.routeAlternative,
};

export default function RoutePolyline({
  coordinates,
  kind = "active",
  strokeWidth,
}: RoutePolylineProps) {
  if (coordinates.length < 2) return null;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={STROKE[kind]}
      strokeWidth={strokeWidth ?? (kind === "alternative" ? 4 : 6)}
      lineCap="round"
      lineJoin="round"
    />
  );
}
