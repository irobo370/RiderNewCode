export const rideQueryKeys = {
  all: ["rides"] as const,
  quote: (pickupLat: string, pickupLng: string, dropLat: string, dropLng: string) =>
    [...rideQueryKeys.all, "quote", pickupLat, pickupLng, dropLat, dropLng] as const,
  detail: (rideId: string) => [...rideQueryKeys.all, "detail", rideId] as const,
  status: (rideId: string) => [...rideQueryKeys.all, "status", rideId] as const,
  history: (status: string, page: number, limit: number) =>
    [...rideQueryKeys.all, "history", status, page, limit] as const,
  recentDestinations: (limit: number) =>
    [...rideQueryKeys.all, "history", "recent", limit] as const,
};
