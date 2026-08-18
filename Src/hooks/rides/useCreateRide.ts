import { useMutation } from "@tanstack/react-query";
import { createRide } from "../../service/rideService/rideService";
import type { CreateRidePayload, Ride } from "../../service/api/types";

interface CreateRideVariables {
  payload: CreateRidePayload;
  idempotencyKey: string;
}

export function useCreateRide() {
  return useMutation<Ride, Error, CreateRideVariables>({
    mutationFn: ({ payload, idempotencyKey }) =>
      createRide(payload, idempotencyKey),
  });
}
