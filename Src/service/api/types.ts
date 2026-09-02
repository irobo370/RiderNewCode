export interface ApiErrorData {
  code?: string;
  errors?: unknown[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | ApiErrorData | null;
}

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface Coordinates {
  lat: string;
  lng: string;
}

export interface OTPSentData {
  expires_in_minutes: number;
  is_new_user: boolean;
  debug_otp?: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user_id: string;
  role: string;
  is_new_user?: boolean;
}

export interface AuthMeData {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

export interface ProfileData {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  address_line: string;
  lat: string;
  lng: string;
  is_default: boolean;
  distance_m?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressPayload {
  label: string;
  address_line: string;
  lat: string;
  lng: string;
  is_default?: boolean;
}

export interface UpdateAddressPayload {
  label?: string;
  address_line?: string;
  lat?: string;
  lng?: string;
  is_default?: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at?: string;
}

export interface CreatePaymentMethodPayload {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default?: boolean;
}

export interface UserSettings {
  notifications_enabled: boolean;
  language: string;
}

export interface UpdateUserSettingsPayload {
  notifications_enabled?: boolean;
  language?: string;
}

export type InsightsPeriod = "weekly" | "monthly";

export interface InsightTrendPoint {
  label: string;
  date: string;
  ride_count: number;
}

export interface InsightDistributionItem {
  slug: string;
  name: string;
  count: number;
  percent: number;
}

export interface InsightsData {
  period: InsightsPeriod;
  rides_count: number;
  total_km: string;
  total_spend: string;
  currency: string;
  trend: InsightTrendPoint[];
  comparison_pct: number;
  distribution: InsightDistributionItem[];
}

export interface RideQuoteOption {
  slug: string;
  name: string;
  description?: string;
  icon_url?: string | null;
  available: boolean;
  drivers_nearby: number;
  estimated_fare: string;
  pickup_eta_min?: number;
  trip_duration_min: number;
  total_eta_min?: number;
}

export interface RideQuote {
  pickup_address: string;
  drop_address: string;
  route: {
    distance_km: string;
    duration_min: string;
    polyline: string | null;
  };
  currency: string;
  surge_multiplier: string;
  quote_expires_at: string;
  options: RideQuoteOption[];
}

export interface DriverSummary {
  id: string;
  name: string;
  phone: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  lat?: string | number;
  lng?: string | number;
  eta_min?: number;
  rating?: number;
  total_trips?: number;
}

export type RideStatus =
  | "requested"
  | "searching_driver"
  | "driver_assigned"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Ride {
  id: string;
  status: RideStatus;
  pickup_lat: string;
  pickup_lng: string;
  pickup_address: string;
  drop_lat: string;
  drop_lng: string;
  drop_address: string;
  estimated_fare: string;
  final_fare: string | null;
  distance_km: string | null;
  duration_min: string | null;
  surge_multiplier: string;
  ride_type_slug: string | null;
  requested_at: string;
  driver_assigned_at: string | null;
  driver_arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  driver: DriverSummary | null;
  route_polyline: string | null;
  invoice_available: boolean;
  start_otp: string | null;
}

export interface ActiveRidePayload {
  has_active_ride: boolean;
  ride: Ride | null;
}

export interface RideHistoryPage {
  items: Ride[];
  page: number;
  limit: number;
  total: number;
}

export interface RepeatRideData {
  pickup: Coordinates;
  drop: Coordinates;
  pickup_address: string;
  drop_address: string;
  ride_type_slug: string;
}

export interface RideStatusResponse {
  id: string;
  status: RideStatus;
  message: string;
  driver?: DriverSummary;
  route_polyline?: string;
  leg_polyline?: string;
  start_otp?: string | null;
}

export interface RideInvoice {
  available: boolean;
  ride_id: string;
  status: RideStatus;
  pickup_address: string;
  drop_address: string;
  final_fare: string;
  currency: string;
  completed_at: string;
  driver: DriverSummary | null;
  download_url: string | null;
}

export interface CreateRidePayload {
  pickup: Coordinates;
  drop: Coordinates;
  pickup_address: string;
  drop_address: string;
  ride_type_slug: string;
}

export interface QuotePayload {
  pickup: Coordinates;
  drop: Coordinates;
}

/** Gateway checkout methods from GET /api/v1/payments/methods */
export type PaymentMethodCode =
  | "orange_money"
  | "mpesa"
  | "airtel_money"
  | "card"
  | "cash";

export interface GatewayPaymentMethod {
  name: string;
  code: PaymentMethodCode;
  is_enabled: boolean;
}

export interface InitiatePaymentRequest {
  ride_id: string;
  payment_method: PaymentMethodCode;
  customer_phone?: string;
  return_url?: string;
}

export type GatewayPaymentStatus = "pending" | "success" | "failed";

export interface InitiatePaymentData {
  payment_id: string;
  ride_id: string;
  status: string;
  amount: string;
  currency: string;
  payment_method: PaymentMethodCode | string;
  checkout_url: string | null;
}

export interface PaymentStatusData {
  payment_id: string;
  ride_id: string;
  status: GatewayPaymentStatus | string;
  amount: string;
  currency: string;
  payment_method?: PaymentMethodCode | string;
}

export type PaymentFlowStatus =
  | "idle"
  | "loading"
  | "pending"
  | "success"
  | "failed";

export interface PaymentSession {
  paymentId: string | null;
  rideId: string | null;
  status: PaymentFlowStatus;
  selectedMethod: PaymentMethodCode | null;
  methodName: string | null;
  amount: string | null;
  currency: string | null;
  checkoutUrl: string | null;
  error: string | null;
  paidAt: string | null;
}

/**
 * BLOCKED — Backend receipt endpoint required.
 * Shape reserved so the UI can connect once the contract is provided.
 */
export interface PaymentReceipt {
  ride_id: string;
  payment_id: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_status: string;
  paid_at?: string | null;
}

export type RideWsEvent =
  | { type: "connected"; ride_id?: string; user_id?: string }
  | {
      type: "status";
      ride_id?: string;
      status: RideStatus;
      message?: string;
      created_at?: string;
      route_polyline?: string;
      leg_polyline?: string;
      start_otp?: string | null;
      final_fare?: string | null;
      driver?: DriverSummary | Partial<DriverSummary>;
    }
  | {
      type: "location_update";
      ride_id?: string;
      status?: RideStatus;
      route_polyline?: string;
      leg_polyline?: string;
      driver: Partial<DriverSummary> & {
        lat?: string | number;
        lng?: string | number;
      };
      updated_at?: string;
    }
  | {
      type: "payment_completed";
      ride_id?: string;
      payment_status?: string;
      amount?: number | string;
      payment_method?: PaymentMethodCode | string;
      currency?: string;
      payment_id?: string;
    };
