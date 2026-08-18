import { useMutation } from "@tanstack/react-query";
import { cancelRide } from "../../service/rideService/rideService";
import type { Ride } from "../../service/api/types";

export function useCancelRide() {
  return useMutation<Ride, Error, string>({
    mutationFn: (rideId) => cancelRide(rideId),
  });
}
