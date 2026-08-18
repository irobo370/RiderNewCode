import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { getRideHistory } from "../../service/rideService/rideService";
import { rideQueryKeys } from "./rideQueryKeys";
import {
  ridesToRecentDestinations,
  type RecentDestination,
} from "../../utils/recentDestinations";

export function useRecentDestinations(limit = 2) {
  const isFocused = useIsFocused();
  const isAuthenticated = useSelector(
    (state: { session?: { isAuthenticated?: boolean } }) =>
      state.session?.isAuthenticated ?? false,
  );

  return useQuery<RecentDestination[]>({
    queryKey: rideQueryKeys.recentDestinations(limit),
    queryFn: async () => {
      const history = await getRideHistory({
        status: "completed",
        page: 1,
        limit: 10,
      });
      return ridesToRecentDestinations(history.items, limit);
    },
    enabled: isAuthenticated && isFocused,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
