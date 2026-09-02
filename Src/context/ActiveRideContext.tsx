import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IDLE_PAYMENT_SESSION,
  isPaymentFailedStatus,
  isPaymentSuccessStatus,
  logPayment,
} from "../constants/paymentGateway";
import type {
  DriverSummary,
  PaymentSession,
  Ride,
  RideStatus,
} from "../service/api/types";
import { normalizeStartOtp } from "../utils/rideHelpers";
import {
  clearPersistedPaymentSession,
  persistPaymentSession,
} from "../utils/paymentSessionStorage";

type WsDriverUpdate = DriverSummary | Partial<DriverSummary> | null;

type WsUpdate = {
  status?: RideStatus;
  message?: string;
  driver?: WsDriverUpdate;
  route_polyline?: string | null;
  leg_polyline?: string | null;
  start_otp?: string | null;
  final_fare?: string | null;
  payment_completed?: {
    ride_id?: string;
    payment_status?: string;
    amount?: number | string;
    payment_method?: string;
    currency?: string;
    payment_id?: string;
  };
};

interface ActiveRideContextValue {
  activeRide: Ride | null;
  wsStatus: RideStatus | null;
  driver: DriverSummary | null;
  startOtp: string | null;
  routePolyline: string | null;
  legPolyline: string | null;
  tripPaymentMethod: { id: string; label: string } | null;
  paymentSession: PaymentSession;
  setTripPaymentMethod: (method: { id: string; label: string } | null) => void;
  setActiveRide: (ride: Ride | null) => void;
  patchPaymentSession: (patch: Partial<PaymentSession>) => void;
  replacePaymentSession: (session: PaymentSession) => void;
  resetPaymentSession: () => void;
  updateFromWs: (update: WsUpdate) => void;
  clearActiveRide: () => void;
}

const ActiveRideContext = createContext<ActiveRideContextValue | null>(null);

function mergeDriver(
  prev: DriverSummary | null,
  update: WsDriverUpdate,
): DriverSummary | null {
  if (!update) {
    return prev;
  }

  return {
    ...(prev ?? ({} as DriverSummary)),
    ...update,
  } as DriverSummary;
}

function amountToString(amount: number | string | null | undefined): string | null {
  if (amount == null) {
    return null;
  }
  return String(amount);
}

export function ActiveRideProvider({ children }: { children: React.ReactNode }) {
  const [activeRide, setActiveRideState] = useState<Ride | null>(null);
  const [wsStatus, setWsStatus] = useState<RideStatus | null>(null);
  const [driver, setDriver] = useState<DriverSummary | null>(null);
  const [startOtp, setStartOtp] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [legPolyline, setLegPolyline] = useState<string | null>(null);
  const [tripPaymentMethod, setTripPaymentMethod] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [paymentSession, setPaymentSession] =
    useState<PaymentSession>(IDLE_PAYMENT_SESSION);
  const activeRideRef = useRef<Ride | null>(null);
  const paymentFinalizedRef = useRef(false);
  const paymentSessionRef = useRef<PaymentSession>(IDLE_PAYMENT_SESSION);

  const persistNextSession = useCallback((next: PaymentSession) => {
    paymentSessionRef.current = next;
    void persistPaymentSession(next);
  }, []);

  const setActiveRide = useCallback((ride: Ride | null) => {
    activeRideRef.current = ride;
    setActiveRideState(ride);
    setWsStatus(ride?.status ?? null);
    setDriver(ride?.driver ?? null);
    const nextOtp = normalizeStartOtp(ride?.start_otp);
    if (nextOtp) {
      setStartOtp(nextOtp);
    } else if (
      !ride ||
      ride.status === "in_progress" ||
      ride.status === "completed" ||
      ride.status === "cancelled"
    ) {
      setStartOtp(null);
    }
    setRoutePolyline(ride?.route_polyline ?? null);
    setLegPolyline(null);
  }, []);

  const patchPaymentSession = useCallback(
    (patch: Partial<PaymentSession>) => {
      setPaymentSession((prev) => {
        const next = { ...prev, ...patch };
        if (next.status === "success" || next.status === "failed") {
          paymentFinalizedRef.current = true;
        } else if (next.status === "idle" || next.status === "loading") {
          paymentFinalizedRef.current = false;
        }
        persistNextSession(next);
        return next;
      });
    },
    [persistNextSession],
  );

  const replacePaymentSession = useCallback(
    (session: PaymentSession) => {
      paymentFinalizedRef.current = session.status === "success" || session.status === "failed";
      persistNextSession(session);
      setPaymentSession(session);
    },
    [persistNextSession],
  );

  const resetPaymentSession = useCallback(() => {
    paymentFinalizedRef.current = false;
    paymentSessionRef.current = IDLE_PAYMENT_SESSION;
    setPaymentSession(IDLE_PAYMENT_SESSION);
    void clearPersistedPaymentSession();
  }, []);

  const updateFromWs = useCallback(
    (update: WsUpdate) => {
      if (!activeRideRef.current) {
        return;
      }

      if (update.payment_completed) {
        const event = update.payment_completed;
        const currentRideId = activeRideRef.current.id;
        if (event.ride_id && event.ride_id !== currentRideId) {
          return;
        }

        if (paymentFinalizedRef.current) {
          logPayment("Ignoring duplicate payment_completed event");
          return;
        }

        logPayment("WebSocket payment_completed received");

        const eventStatus = event.payment_status ?? "success";
        if (isPaymentFailedStatus(eventStatus)) {
          paymentFinalizedRef.current = true;
          setPaymentSession((prev) => {
            const next: PaymentSession = {
              ...prev,
              rideId: currentRideId,
              status: "failed",
              amount: amountToString(event.amount) ?? prev.amount,
              currency: event.currency ?? prev.currency,
              methodName: event.payment_method
                ? prev.methodName ?? String(event.payment_method)
                : prev.methodName,
              checkoutUrl: null,
              error: "Payment failed",
            };
            persistNextSession(next);
            return next;
          });
          return;
        }

        if (!isPaymentSuccessStatus(eventStatus) && eventStatus !== "success") {
          return;
        }

        paymentFinalizedRef.current = true;
        setPaymentSession((prev) => {
          const next: PaymentSession = {
            ...prev,
            rideId: currentRideId,
            paymentId: event.payment_id ?? prev.paymentId,
            status: "success",
            amount: amountToString(event.amount) ?? prev.amount,
            currency: event.currency ?? prev.currency,
            selectedMethod: prev.selectedMethod,
            methodName: event.payment_method
              ? prev.methodName ?? String(event.payment_method)
              : prev.methodName,
            checkoutUrl: null,
            error: null,
            paidAt: prev.paidAt ?? new Date().toISOString(),
          };
          persistNextSession(next);
          return next;
        });
        return;
      }

      if (update.status) {
        setWsStatus(update.status);
        setActiveRideState((prev) =>
          prev ? { ...prev, status: update.status! } : prev,
        );
      }

      if (update.final_fare != null) {
        setActiveRideState((prev) =>
          prev ? { ...prev, final_fare: update.final_fare ?? null } : prev,
        );
      }

      if (update.start_otp !== undefined) {
        const nextOtp = normalizeStartOtp(update.start_otp);
        if (nextOtp) {
          setStartOtp(nextOtp);
          setActiveRideState((prev) =>
            prev ? { ...prev, start_otp: nextOtp } : prev,
          );
        }
      }

      if (update.status === "in_progress") {
        setStartOtp(null);
        setActiveRideState((prev) =>
          prev ? { ...prev, start_otp: null } : prev,
        );
        if (update.leg_polyline === undefined) {
          setLegPolyline(null);
        }
      }

      if (update.driver) {
        setDriver((prev) => mergeDriver(prev, update.driver));
        setActiveRideState((prev) =>
          prev
            ? {
                ...prev,
                driver: mergeDriver(prev.driver, update.driver),
              }
            : prev,
        );
      }

      if (update.route_polyline !== undefined) {
        setRoutePolyline(update.route_polyline);
      }

      if (update.leg_polyline !== undefined) {
        setLegPolyline(update.leg_polyline);
      }
    },
    [persistNextSession],
  );

  const clearActiveRide = useCallback(() => {
    activeRideRef.current = null;
    paymentFinalizedRef.current = false;
    paymentSessionRef.current = IDLE_PAYMENT_SESSION;
    setActiveRideState(null);
    setWsStatus(null);
    setDriver(null);
    setStartOtp(null);
    setRoutePolyline(null);
    setLegPolyline(null);
    setTripPaymentMethod(null);
    setPaymentSession(IDLE_PAYMENT_SESSION);
    void clearPersistedPaymentSession();
  }, []);

  const value = useMemo(
    () => ({
      activeRide,
      wsStatus,
      driver,
      startOtp,
      routePolyline,
      legPolyline,
      tripPaymentMethod,
      paymentSession,
      setTripPaymentMethod,
      setActiveRide,
      patchPaymentSession,
      replacePaymentSession,
      resetPaymentSession,
      updateFromWs,
      clearActiveRide,
    }),
    [
      activeRide,
      wsStatus,
      driver,
      startOtp,
      routePolyline,
      legPolyline,
      tripPaymentMethod,
      paymentSession,
      setActiveRide,
      patchPaymentSession,
      replacePaymentSession,
      resetPaymentSession,
      updateFromWs,
      clearActiveRide,
    ],
  );

  return (
    <ActiveRideContext.Provider value={value}>
      {children}
    </ActiveRideContext.Provider>
  );
}

export function useActiveRide() {
  const context = useContext(ActiveRideContext);
  if (!context) {
    throw new Error("useActiveRide must be used within ActiveRideProvider");
  }
  return context;
}
