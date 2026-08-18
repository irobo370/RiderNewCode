import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { DriverSummary, Ride, RideStatus } from "../service/api/types";
import { normalizeStartOtp } from "../utils/rideHelpers";

type WsDriverUpdate = DriverSummary | Partial<DriverSummary> | null;

interface ActiveRideContextValue {
  activeRide: Ride | null;
  wsStatus: RideStatus | null;
  driver: DriverSummary | null;
  startOtp: string | null;
  routePolyline: string | null;
  legPolyline: string | null;
  tripPaymentMethod: { id: string; label: string } | null;
  setTripPaymentMethod: (method: { id: string; label: string } | null) => void;
  setActiveRide: (ride: Ride | null) => void;
  updateFromWs: (update: {
    status?: RideStatus;
    message?: string;
    driver?: WsDriverUpdate;
    route_polyline?: string | null;
    leg_polyline?: string | null;
    start_otp?: string | null;
    final_fare?: string | null;
  }) => void;
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

  const setActiveRide = useCallback((ride: Ride | null) => {
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

  const updateFromWs = useCallback(
    (update: {
      status?: RideStatus;
      message?: string;
      driver?: WsDriverUpdate;
      route_polyline?: string | null;
      leg_polyline?: string | null;
      start_otp?: string | null;
      final_fare?: string | null;
    }) => {
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

      // Ride started → hide start OTP, switch to live trip
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
    [],
  );

  const clearActiveRide = useCallback(() => {
    setActiveRideState(null);
    setWsStatus(null);
    setDriver(null);
    setStartOtp(null);
    setRoutePolyline(null);
    setLegPolyline(null);
    setTripPaymentMethod(null);
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
      setTripPaymentMethod,
      setActiveRide,
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
      setActiveRide,
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
