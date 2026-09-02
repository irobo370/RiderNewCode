import { useEffect, useRef } from "react";
import SecureStorage from "../../utils/SecureStorage";
import { getWsBaseUrl } from "../../service/api/apiClient";
import { RIDE_ENDPOINTS } from "../../service/config/apiEndPoint";
import type {
  DriverSummary,
  RideWsEvent,
} from "../../service/api/types";
import { useActiveRide } from "../../context/ActiveRideContext";
import { normalizeStartOtp } from "../../utils/rideHelpers";

const rideSocketRef: { current: WebSocket | null } = { current: null };

export function sendRideCancel(rideId?: string | null) {
  const ws = rideSocketRef.current;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  const payload = {
    type: "cancel",
    ...(rideId ? { ride_id: rideId } : {}),
  };
  ws.send(JSON.stringify(payload));
  logWs("SEND", payload);
  try {
    ws.close();
  } catch {
    // ignore
  }
  if (rideSocketRef.current === ws) {
    rideSocketRef.current = null;
  }
  return true;
}

const MAX_RECONNECT_ATTEMPTS = 12;
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 15000;

function logWs(message: string, payload?: unknown) {
  console.log(`\n===== WS App Sending ${message} =====`);
  if (payload !== undefined) {
    console.log(
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
    );
  }
  console.log("========================\n");
}

function normalizeDriver(
  driver?: Partial<DriverSummary> | null,
): Partial<DriverSummary> | null {
  if (!driver) {
    return null;
  }

  const next: Partial<DriverSummary> = { ...driver };

  if (driver.lat != null) {
    next.lat = String(driver.lat);
  }
  if (driver.lng != null) {
    next.lng = String(driver.lng);
  }

  return next;
}

/**
 * Connects to ride WebSocket as soon as a ride_id exists.
 * HTTP status polling is disabled — reconnects over WS only.
 *
 * wss://…/api/v1/ws/rides/{ride_id}?token=<RIDER_ACCESS_TOKEN>
 */
export function useRideWebSocket(
  rideId: string | null | undefined,
  reconnectNonce = 0,
) {
  const { updateFromWs, clearActiveRide } = useActiveRide();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    if (!rideId) return;

    let isActive = true;
    intentionalCloseRef.current = false;
    reconnectAttemptRef.current = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isActive || intentionalCloseRef.current) return;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        logWs("RECONNECT GIVEN UP", {
          rideId,
          attempts: reconnectAttemptRef.current,
        });
        return;
      }

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(
        BASE_RECONNECT_MS * 2 ** attempt,
        MAX_RECONNECT_MS,
      );
      reconnectAttemptRef.current = attempt + 1;

      logWs("RECONNECT SCHEDULED", { rideId, attempt: attempt + 1, delay });
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(() => {
        if (isActive && !intentionalCloseRef.current) {
          connect();
        }
      }, delay);
    };

    const extractStartOtp = (
      payload: RideWsEvent | Record<string, unknown>,
    ) => {
      const record = payload as Record<string, unknown>;
      const nested =
        record.data && typeof record.data === "object"
          ? (record.data as Record<string, unknown>)
          : null;
      return (
        normalizeStartOtp(record.start_otp) ??
        normalizeStartOtp(record.startOtp) ??
        normalizeStartOtp(record.otp) ??
        normalizeStartOtp(nested?.start_otp) ??
        normalizeStartOtp(nested?.otp)
      );
    };

    const handleEvent = (data: RideWsEvent) => {
      if (data.type === "connected") {
        return;
      }

      if (data.type === "location_update") {
        const locationOtp = extractStartOtp(data);
        updateFromWs({
          driver: normalizeDriver(data.driver),
          route_polyline: data.route_polyline,
          leg_polyline: data.leg_polyline,
          ...(locationOtp ? { start_otp: locationOtp } : {}),
        });
        return;
      }

      if (data.type === "payment_completed") {
        updateFromWs({
          payment_completed: {
            ride_id: data.ride_id,
            payment_status: data.payment_status,
            amount: data.amount,
            payment_method: data.payment_method,
            currency: data.currency,
            payment_id: data.payment_id,
          },
        });
        return;
      }

      if (data.type === "status") {
        const startOtp = extractStartOtp(data);
        updateFromWs({
          status: data.status,
          message: data.message,
          driver: normalizeDriver(data.driver ?? null),
          route_polyline: data.route_polyline,
          leg_polyline: data.leg_polyline,
          ...(startOtp ? { start_otp: startOtp } : {}),
          final_fare: data.final_fare ?? null,
        });

        if (data.status === "cancelled") {
          intentionalCloseRef.current = true;
          wsRef.current?.close();
          clearActiveRide();
        }
      }
    };

    const connect = async () => {
      const token = await SecureStorage.getAccessToken();
      if (!token || !isActive || intentionalCloseRef.current) {
        logWs("NO TOKEN — WS SKIPPED", { rideId });
        return;
      }

      // Close any previous socket before opening a new one
      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.onmessage = null;
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }

      const wsUrl = `${getWsBaseUrl()}${RIDE_ENDPOINTS.Ws(rideId)}?token=${encodeURIComponent(token)}`;
      logWs("CONNECTING", wsUrl.replace(/token=[^&]+/, "token=***"));

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      rideSocketRef.current = ws;

      ws.onopen = () => {
        logWs("OPEN", { rideId });
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        const rawPayload =
          typeof event.data === "string"
            ? event.data
            : JSON.stringify(event.data);
        console.log("[RideSocket] raw payload:", rawPayload);
        try {
          const data = JSON.parse(event.data) as RideWsEvent;
          console.log(
            "[RideSocket] parsed payload:",
            JSON.stringify(data, null, 2),
          );
          logWs("MESSAGE", data);
          handleEvent(data);
        } catch (error) {
          console.log("[RideSocket] parse error:", String(error));
          logWs("PARSE ERROR", String(error));
        }
      };

      ws.onerror = () => {
        logWs("ERROR", { rideId });
      };

      ws.onclose = (event) => {
        logWs("CLOSED", { rideId, code: event.code, reason: event.reason });
        if (rideSocketRef.current === ws) {
          rideSocketRef.current = null;
        }
        wsRef.current = null;

        if (!isActive || intentionalCloseRef.current) {
          return;
        }

        // Auth failure — try one immediate reconnect (token refresh may have run)
        if (event.code === 4001 && reconnectAttemptRef.current === 0) {
          reconnectAttemptRef.current = 1;
          connect();
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      isActive = false;
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
      if (rideSocketRef.current === ws) {
        rideSocketRef.current = null;
      }
    };
  }, [rideId, reconnectNonce, updateFromWs, clearActiveRide]);
}
