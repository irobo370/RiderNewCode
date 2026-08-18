import React, { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import Toast from "react-native-toast-message";
import { useActiveRide } from "../context/ActiveRideContext";
import { useRideWebSocket } from "../hooks/rides/useRideWebSocket";
import { navigateToRidePayment } from "../navigation/navigationRef";
import { getRide } from "../service/rideService/rideService";
import type { RideStatus } from "../service/api/types";

const TERMINAL_STATUSES: RideStatus[] = ["completed", "cancelled"];

export default function RideWebSocketWatcher() {
  const { activeRide, wsStatus, driver, startOtp, setActiveRide, updateFromWs } =
    useActiveRide();
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const prevStatusRef = useRef<RideStatus | null>(null);
  const navigatedToSummaryRef = useRef(false);
  const activeRideIdRef = useRef<string | null>(null);

  activeRideIdRef.current = activeRide?.id ?? null;

  const currentStatus = (wsStatus ?? activeRide?.status ?? null) as RideStatus | null;
  const shouldConnect = Boolean(
    activeRide?.id && currentStatus && !TERMINAL_STATUSES.includes(currentStatus),
  );

  useRideWebSocket(shouldConnect ? activeRide!.id : null, reconnectNonce);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;

      const rideId = activeRideIdRef.current;
      if (!rideId) return;

      try {
        const ride = await getRide(rideId);
        setActiveRide(ride);
        setReconnectNonce((value) => value + 1);

        if (__DEV__) {
          console.log("\n===== APP RESUME — RIDE SYNC =====");
          console.log("Ride ID:", ride.id);
          console.log("Status:", ride.status);
          console.log("==================================\n");
        }

        if (
          ride.status === "completed" &&
          !navigatedToSummaryRef.current
        ) {
          navigatedToSummaryRef.current = true;
          navigateToRidePayment();
        }
      } catch {
        setReconnectNonce((value) => value + 1);
      }
    });

    return () => subscription.remove();
  }, [setActiveRide]);

  useEffect(() => {
    if (!currentStatus || prevStatusRef.current === currentStatus) return;

    if (
      currentStatus === "driver_assigned" &&
      prevStatusRef.current !== "driver_assigned"
    ) {
      const plate = driver?.vehicle_plate ? ` · ${driver.vehicle_plate}` : "";
      Toast.show({
        type: "success",
        text1: "Driver assigned",
        text2: driver?.name
          ? `${driver.name}${plate} is on the way. Share the OTP.`
          : "Your driver is heading to you. Share the OTP.",
      });
    }

    if (
      currentStatus === "driver_arrived" &&
      prevStatusRef.current !== "driver_arrived"
    ) {
      Toast.show({
        type: "info",
        text1: "Driver arrived",
        text2: "Share the start OTP with your driver",
      });
    }

    if (
      currentStatus === "in_progress" &&
      prevStatusRef.current !== "in_progress"
    ) {
      Toast.show({
        type: "success",
        text1: "Trip started",
        text2: "Enjoy your ride",
      });
    }

    if (
      currentStatus === "completed" &&
      prevStatusRef.current !== "completed"
    ) {
      Toast.show({
        type: "success",
        text1: "Ride completed",
        text2: "Thanks for riding with us",
      });

      if (!navigatedToSummaryRef.current) {
        navigatedToSummaryRef.current = true;
        navigateToRidePayment();
      }

      prevStatusRef.current = currentStatus;
      return;
    }

    if (currentStatus === "cancelled" && prevStatusRef.current !== "cancelled") {
      Toast.show({
        type: "info",
        text1: "Ride cancelled",
      });
    }

    prevStatusRef.current = currentStatus;
  }, [currentStatus, driver?.name, driver?.vehicle_plate]);

  useEffect(() => {
    const needsOtp =
      currentStatus === "driver_assigned" || currentStatus === "driver_arrived";
    const rideId = activeRide?.id;
    if (!needsOtp || !rideId || startOtp) return;

    let cancelled = false;
    getRide(rideId)
      .then((ride) => {
        if (cancelled) return;
        updateFromWs({
          status: ride.status,
          driver: ride.driver,
          start_otp:
            ride.start_otp ??
            (ride as { otp?: string | null }).otp ??
            null,
          route_polyline: ride.route_polyline,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentStatus, activeRide?.id, startOtp, updateFromWs]);

  useEffect(() => {
    if (!activeRide) {
      prevStatusRef.current = null;
      navigatedToSummaryRef.current = false;
    }
  }, [activeRide]);

  return null;
}
