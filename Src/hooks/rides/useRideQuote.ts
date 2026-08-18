import { useMutation } from "@tanstack/react-query";
import { postQuote } from "../../service/rideService/rideService";
import type { QuotePayload, RideQuote } from "../../service/api/types";

export function useRideQuote() {
  return useMutation<RideQuote, Error, QuotePayload>({
    mutationFn: (payload) => postQuote(payload),
  });
}
