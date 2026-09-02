import { getActiveCountry } from "../constants/locale";
import { getCurrencyMeta } from "../constants/countries";
import type { Ride, RideStatus } from "../service/api/types";

const RIDE_TYPE_SLUG_MAP: Record<string, string> = {
  Mini: "mini",
  Prime: "sedan",
  Bike: "bike",
  XL: "xl",
};

export function mapRideTypeToSlug(rideType: string | null | undefined): string {
  if (!rideType) return "mini";
  return RIDE_TYPE_SLUG_MAP[rideType] ?? rideType.toLowerCase();
}

export function generateIdempotencyKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Normalize ride start OTP from API/WS payloads (string or number). */
export function normalizeStartOtp(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return null;
  return text;
}

const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_arrived",
  "in_progress",
];

export function isOngoingRideStatus(
  status: RideStatus | string | null | undefined,
): boolean {
  return Boolean(status && ACTIVE_RIDE_STATUSES.includes(status as RideStatus));
}

export function normalizeRecoveredRide(ride: Partial<Ride> & { id: string }): Ride {
  return {
    id: ride.id,
    status: ride.status ?? "searching_driver",
    pickup_lat: String(ride.pickup_lat ?? ""),
    pickup_lng: String(ride.pickup_lng ?? ""),
    pickup_address: ride.pickup_address ?? "Pickup",
    drop_lat: String(ride.drop_lat ?? ""),
    drop_lng: String(ride.drop_lng ?? ""),
    drop_address: ride.drop_address ?? "Drop",
    estimated_fare: ride.estimated_fare ?? "0",
    final_fare: ride.final_fare ?? null,
    distance_km: ride.distance_km ?? null,
    duration_min: ride.duration_min ?? null,
    surge_multiplier: ride.surge_multiplier ?? "1",
    ride_type_slug: ride.ride_type_slug ?? null,
    requested_at: ride.requested_at ?? new Date().toISOString(),
    driver_assigned_at: ride.driver_assigned_at ?? null,
    driver_arrived_at: ride.driver_arrived_at ?? null,
    started_at: ride.started_at ?? null,
    completed_at: ride.completed_at ?? null,
    cancelled_at: ride.cancelled_at ?? null,
    driver: ride.driver ?? null,
    route_polyline: ride.route_polyline ?? null,
    invoice_available: ride.invoice_available ?? false,
    start_otp: normalizeStartOtp(ride.start_otp),
  };
}

export function formatFare(
  currency: string | undefined,
  amount: string,
): string {
  const resolvedCurrency = currency || getActiveCountry().currency;
  const num = parseFloat(amount);
  const { symbol, locale } = getCurrencyMeta(resolvedCurrency);
  if (Number.isNaN(num)) return `${symbol}${amount}`;
  return `${symbol}${Math.round(num).toLocaleString(locale)}`;
}

export function rideTypeIcon(slug: string): "bicycle" | "car-sport-outline" {
  return slug === "bike" ? "bicycle" : "car-sport-outline";
}

export function toCoordinates(location: {
  latitude: number;
  longitude: number;
}) {
  return {
    lat: String(location.latitude),
    lng: String(location.longitude),
  };
}

/** True when a string is just "lat, lng" instead of a place name. */
export function isCoordinateLikeAddress(
  value?: string | null,
): boolean {
  if (!value?.trim()) return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(value.trim());
}

/**
 * Prefer a real place address the user selected; skip lat/lng placeholders
 * that the quote API sometimes returns.
 */
export function resolveDisplayAddress(
  preferred?: string | null,
  fallback?: string | null,
  placeholder = "Location",
): string {
  if (preferred && !isCoordinateLikeAddress(preferred)) {
    return preferred.trim();
  }
  if (fallback && !isCoordinateLikeAddress(fallback)) {
    return fallback.trim();
  }
  return placeholder;
}
