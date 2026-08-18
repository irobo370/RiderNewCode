import type { Ride } from "../service/api/types";

export type RecentDestination = {
  id: string;
  title: string;
  address: string;
  distance: string;
  latitude: number;
  longitude: number;
};

function formatTripDistance(distanceKm: string | null | undefined): string {
  if (!distanceKm) {
    return "—";
  }

  const km = parseFloat(distanceKm);
  if (Number.isNaN(km)) {
    return "—";
  }

  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km.toFixed(1)} km`;
}

function destinationTitle(address: string): string {
  const firstSegment = address.split(",")[0]?.trim();
  return firstSegment || address;
}

export function ridesToRecentDestinations(
  rides: Ride[],
  limit = 2,
): RecentDestination[] {
  const seen = new Set<string>();
  const results: RecentDestination[] = [];

  const sorted = [...rides].sort((a, b) => {
    const aTime = Date.parse(a.completed_at ?? a.requested_at);
    const bTime = Date.parse(b.completed_at ?? b.requested_at);
    return bTime - aTime;
  });

  for (const ride of sorted) {
    if (ride.status !== "completed") {
      continue;
    }

    const latitude = parseFloat(ride.drop_lat);
    const longitude = parseFloat(ride.drop_lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      continue;
    }

    const address = ride.drop_address?.trim();
    if (!address) {
      continue;
    }

    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    results.push({
      id: ride.id,
      title: destinationTitle(address),
      address,
      distance: formatTripDistance(ride.distance_km),
      latitude,
      longitude,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}
