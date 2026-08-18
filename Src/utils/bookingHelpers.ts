import type { Ride } from "../service/api/types";
import { DEFAULT_CURRENCY } from "../constants/locale";
import { formatFare } from "./rideHelpers";

export function formatRideTypeLabel(slug: string | null | undefined): string {
  if (!slug) {
    return "Ride";
  }

  const labels: Record<string, string> = {
    mini: "Mini",
    sedan: "Sedan",
    bike: "Bike",
    xl: "XL",
  };

  return labels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function formatRideDateTime(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) {
    return { date: "—", time: "—" };
  }

  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return { date: "—", time: "—" };
  }

  return {
    date: value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: value.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function getRideTimestamp(ride: Ride): string {
  return ride.completed_at ?? ride.cancelled_at ?? ride.requested_at;
}

export function getRideFareLabel(ride: Ride): string {
  const amount = ride.final_fare ?? ride.estimated_fare ?? "0";
  return formatFare(ride.currency ?? DEFAULT_CURRENCY, amount);
}

export function isRideCompleted(ride: Ride): boolean {
  return ride.status === "completed";
}

export function isRideCancelled(ride: Ride): boolean {
  return ride.status === "cancelled";
}
