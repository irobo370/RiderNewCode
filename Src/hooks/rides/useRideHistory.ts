import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";

import { getRideHistory } from "../../service/rideService/rideService";
import { rideQueryKeys } from "./rideQueryKeys";

export type BookingFilter = "All" | "Completed" | "Cancelled";

function filterToStatus(filter: BookingFilter) {
  switch (filter) {
    case "Completed":
      return "completed" as const;
    case "Cancelled":
      return "cancelled" as const;
    default:
      return "terminal" as const;
  }
}

export function useRideHistory(filter: BookingFilter) {
  const isFocused = useIsFocused();
  const status = filterToStatus(filter);

  return useQuery({
    queryKey: rideQueryKeys.history(status, 1, 20),
    queryFn: () =>
      getRideHistory({
        status,
        page: 1,
        limit: 20,
      }),
    enabled: isFocused,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
