import { IDLE_PAYMENT_SESSION } from "../constants/paymentGateway";
import type { PaymentSession } from "../service/api/types";
import SecureStorage from "./SecureStorage";

function isPersistedStatus(
  status: PaymentSession["status"],
): status is "pending" | "success" | "failed" {
  return status === "pending" || status === "success" || status === "failed";
}

export async function persistPaymentSession(session: PaymentSession): Promise<void> {
  if (!session.paymentId || !session.rideId || !isPersistedStatus(session.status)) {
    await SecureStorage.removePaymentSession();
    return;
  }

  const payload: PaymentSession = {
    ...session,
    checkoutUrl: null,
    error: null,
    status: session.status,
  };

  await SecureStorage.savePaymentSession(JSON.stringify(payload));
}

export async function loadPaymentSession(): Promise<PaymentSession | null> {
  const raw = await SecureStorage.getPaymentSession();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PaymentSession>;
    if (!parsed.paymentId || !parsed.rideId) {
      return null;
    }

    return {
      ...IDLE_PAYMENT_SESSION,
      ...parsed,
      checkoutUrl: null,
    };
  } catch {
    await SecureStorage.removePaymentSession();
    return null;
  }
}

export async function clearPersistedPaymentSession(): Promise<void> {
  await SecureStorage.removePaymentSession();
}
