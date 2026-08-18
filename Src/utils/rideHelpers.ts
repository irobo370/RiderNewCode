import { DEFAULT_CURRENCY } from "../constants/locale";
import { getCurrencyMeta } from "../constants/countries";

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

export function formatFare(
  currency: string = DEFAULT_CURRENCY,
  amount: string,
): string {
  const num = parseFloat(amount);
  const { symbol, locale } = getCurrencyMeta(currency);
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
