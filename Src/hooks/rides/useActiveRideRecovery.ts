import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSelector } from "react-redux";

import { useActiveRide } from "../../context/ActiveRideContext";
import {
  navigateToRidePayment,
  restoreActiveRideScreen,
} from "../../navigation/navigationRef";
import { getActiveRide } from "../../service/rideService/rideService";
import type { Ride, RideStatus } from "../../service/api/types";
import { loadPaymentSession } from "../../utils/paymentSessionStorage";
import {
  isOngoingRideStatus,
  normalizeRecoveredRide,
} from "../../utils/rideHelpers";

type RecoveryResult = {
  ride: Ride | null;
  status: RideStatus | null;
};

export function useActiveRideRecovery(onRecovered?: (ride: Ride | null) => void) {
  const isAuthenticated = useSelector(
    (state: { session?: { isAuthenticated?: boolean } }) =>
      state.session?.isAuthenticated ?? false,
  );
  const {
    activeRide,
    paymentSession,
    setActiveRide,
    clearActiveRide,
    replacePaymentSession,
  } = useActiveRide();
  const recoveringRef = useRef(false);
  const activeRideIdRef = useRef<string | null>(null);
  const activeRideStatusRef = useRef<RideStatus | null>(null);
  const paymentStatusRef = useRef(paymentSession.status);

  activeRideIdRef.current = activeRide?.id ?? null;
  activeRideStatusRef.current = activeRide?.status ?? null;
  paymentStatusRef.current = paymentSession.status;

  const recover = useCallback(async (): Promise<RecoveryResult | null> => {
    if (!isAuthenticated || recoveringRef.current) {
      return null;
    }

    recoveringRef.current = true;
    try {
      const payload = await getActiveRide();
      const rawRide = payload?.has_active_ride ? payload.ride : null;

      if (!rawRide?.id) {
        const keepCompletedFlow =
          activeRideStatusRef.current === "completed" ||
          paymentStatusRef.current === "pending" ||
          paymentStatusRef.current === "success" ||
          paymentStatusRef.current === "failed";

        if (keepCompletedFlow) {
          return {
            ride: null,
            status: activeRideStatusRef.current,
          };
        }

        if (activeRideIdRef.current) {
          clearActiveRide();
          onRecovered?.(null);
        }
        return { ride: null, status: null };
      }

      const ride = normalizeRecoveredRide(rawRide);

      if (isOngoingRideStatus(ride.status)) {
        onRecovered?.(ride);
        setActiveRide(ride);
        restoreActiveRideScreen();
        return { ride, status: ride.status };
      }

      if (ride.status === "completed") {
        onRecovered?.(ride);
        setActiveRide(ride);
        const savedSession = await loadPaymentSession();
        if (savedSession?.rideId === ride.id) {
          replacePaymentSession(savedSession);
        }
        if (paymentStatusRef.current !== "success") {
          navigateToRidePayment();
        }
        return { ride, status: ride.status };
      }

      clearActiveRide();
      onRecovered?.(null);
      return { ride: null, status: ride.status };
    } catch (error) {
      if (__DEV__) {
        console.log("\n===== ACTIVE RIDE RECOVERY FAILED =====");
        console.log(String(error));
        console.log("=======================================\n");
      }
      return null;
    } finally {
      recoveringRef.current = false;
    }
  }, [
    clearActiveRide,
    isAuthenticated,
    onRecovered,
    replacePaymentSession,
    setActiveRide,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    recover();
  }, [isAuthenticated, recover]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || !isAuthenticated) {
        return;
      }
      recover();
    });

    return () => subscription.remove();
  }, [isAuthenticated, recover]);

  return { recover };
}
