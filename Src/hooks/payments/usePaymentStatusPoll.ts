import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  PAYMENT_STATUS_POLL_INTERVAL_MS,
  PAYMENT_STATUS_POLL_MAX_ATTEMPTS,
  isPaymentSuccessStatus,
  logPayment,
} from "../../constants/paymentGateway";
import { getPaymentStatus } from "../../service/paymentService/paymentGatewayService";
import type { PaymentStatusData } from "../../service/api/types";

type Options = {
  paymentId: string | null;
  enabled: boolean;
  onStatus: (data: PaymentStatusData) => void;
};

export function usePaymentStatusPoll({ paymentId, enabled, onStatus }: Options) {
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled || !paymentId) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    inFlightRef.current = false;

    logPayment("Starting status polling");

    const tick = async () => {
      if (cancelled || inFlightRef.current) {
        return;
      }

      if (attempts >= PAYMENT_STATUS_POLL_MAX_ATTEMPTS) {
        logPayment("Polling timeout reached");
        return;
      }

      attempts += 1;
      inFlightRef.current = true;

      try {
        const result = await getPaymentStatus(paymentId);
        if (cancelled) {
          return;
        }

        logPayment(`Payment status: ${result.status}`);
        onStatusRef.current(result);

        if (isPaymentSuccessStatus(result.status) || result.status === "failed") {
          cancelled = true;
        }
      } catch {
        // Keep polling; a single status failure must not crash the flow.
      } finally {
        inFlightRef.current = false;
      }
    };

    void tick();
    const intervalId = setInterval(() => {
      void tick();
    }, PAYMENT_STATUS_POLL_INTERVAL_MS);

    const appSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void tick();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appSub.remove();
    };
  }, [enabled, paymentId]);
}
