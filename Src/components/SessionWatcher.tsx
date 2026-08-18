import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useActiveRide } from "../context/ActiveRideContext";

export default function SessionWatcher() {
  const isAuthenticated = useSelector((state: any) => state.session.isAuthenticated);
  const { clearActiveRide } = useActiveRide();

  useEffect(() => {
    if (!isAuthenticated) {
      clearActiveRide();
    }
  }, [isAuthenticated, clearActiveRide]);

  return null;
}
