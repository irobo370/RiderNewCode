import { apiGet, apiPost } from "../api/apiClient";
import { RIDE_ENDPOINTS } from "../config/apiEndPoint";

import type {
  CreateRidePayload,
  QuotePayload,
  RepeatRideData,
  Ride,
  RideHistoryPage,
  RideInvoice,
  RideQuote,
  RideStatusResponse,
} from "../api/types";

export const postQuote = (payload: QuotePayload): Promise<RideQuote> => {
  return apiPost<RideQuote>(RIDE_ENDPOINTS.Quote, payload);
};

export const createRide = (
  payload: CreateRidePayload,
  idempotencyKey: string,
): Promise<Ride> => {
  return apiPost<Ride>(RIDE_ENDPOINTS.Create, payload, {
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
};

export const getRide = (rideId: string): Promise<Ride> => {
  return apiGet<Ride>(RIDE_ENDPOINTS.Detail(rideId));
};

export const getRideStatus = (rideId: string): Promise<RideStatusResponse> => {
  return apiGet<RideStatusResponse>(RIDE_ENDPOINTS.Status(rideId));
};

export const getRideInvoice = (rideId: string): Promise<RideInvoice> => {
  return apiGet<RideInvoice>(RIDE_ENDPOINTS.Invoice(rideId));
};

type RideHistoryParams = {
  page?: number;
  limit?: number;
  status?: "terminal" | "all" | "completed" | "cancelled";
};

export const getRideHistory = (
  params?: RideHistoryParams,
): Promise<RideHistoryPage> => {
  return apiGet<RideHistoryPage>(RIDE_ENDPOINTS.History, { params });
};

export const repeatRide = (rideId: string): Promise<RepeatRideData> => {
  return apiPost<RepeatRideData>(RIDE_ENDPOINTS.Repeat(rideId));
};

export type PayRidePayload = {
  method: string;
  amount?: string;
  phone?: string;
};

export const payRide = (
  rideId: string,
  payload: PayRidePayload,
): Promise<Ride> => {
  return apiPost<Ride>(RIDE_ENDPOINTS.Pay(rideId), payload);
};
