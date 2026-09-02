import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import { API_BASE_URL } from "../service/api/apiClient";
import type { PaymentMethodCode, PaymentSession } from "../service/api/types";
import { getCurrencyMeta, getActiveCountry } from "./countries";

export const PAYMENT_RETURN_URL =
  process.env.EXPO_PUBLIC_PAYMENT_RETURN_URL ??
  `${API_BASE_URL.replace(/\/$/, "")}/payment-result`;

export const PAYMENT_STATUS_POLL_INTERVAL_MS = 4000;
export const PAYMENT_STATUS_POLL_MAX_ATTEMPTS = 30;

export const MOBILE_MONEY_CODES: PaymentMethodCode[] = [
  "orange_money",
  "mpesa",
  "airtel_money",
];

export const IDLE_PAYMENT_SESSION: PaymentSession = {
  paymentId: null,
  rideId: null,
  status: "idle",
  selectedMethod: null,
  methodName: null,
  amount: null,
  currency: null,
  checkoutUrl: null,
  error: null,
  paidAt: null,
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type PaymentMethodKind = "mobile_money" | "cash" | "card" | "other";

const METHOD_META: Record<
  PaymentMethodCode,
  { icon: IoniconName; kind: PaymentMethodKind; subtitle: string }
> = {
  orange_money: {
    icon: "phone-portrait-outline",
    kind: "mobile_money",
    subtitle: "Pay from your Orange Money wallet",
  },
  mpesa: {
    icon: "phone-portrait-outline",
    kind: "mobile_money",
    subtitle: "Pay from your M-Pesa wallet",
  },
  airtel_money: {
    icon: "phone-portrait-outline",
    kind: "mobile_money",
    subtitle: "Pay from your Airtel Money wallet",
  },
  card: {
    icon: "card-outline",
    kind: "card",
    subtitle: "Pay with a debit or credit card",
  },
  cash: {
    icon: "cash-outline",
    kind: "cash",
    subtitle: "Pay the driver in cash",
  },
};

export function isPaymentMethodCode(code: string): code is PaymentMethodCode {
  return code in METHOD_META;
}

export function getPaymentMethodKind(code: string | null | undefined): PaymentMethodKind {
  if (!code || !isPaymentMethodCode(code)) {
    return "other";
  }
  return METHOD_META[code].kind;
}

export function getPaymentMethodIcon(code: string | null | undefined): IoniconName {
  if (!code || !isPaymentMethodCode(code)) {
    return "wallet-outline";
  }
  return METHOD_META[code].icon;
}

export function getPaymentMethodSubtitle(code: string | null | undefined): string {
  if (!code || !isPaymentMethodCode(code)) {
    return "Pay for this ride";
  }
  return METHOD_META[code].subtitle;
}

export function isMobileMoneyMethod(code: string | null | undefined): boolean {
  return getPaymentMethodKind(code) === "mobile_money";
}

export function formatPaymentAmount(
  currency: string | null | undefined,
  amount: string | number | null | undefined,
): string {
  if (amount == null || amount === "") {
    return "—";
  }

  const resolvedCurrency = currency || getActiveCountry().currency;
  const { symbol, locale } = getCurrencyMeta(resolvedCurrency);
  const numeric = typeof amount === "number" ? amount : parseFloat(amount);

  if (Number.isNaN(numeric)) {
    return `${symbol}${String(amount)}`;
  }

  return `${symbol}${numeric.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isPaymentSuccessStatus(status: string | null | undefined): boolean {
  return status === "success" || status === "paid";
}

export function isPaymentFailedStatus(status: string | null | undefined): boolean {
  return status === "failed";
}

export function isPaymentReturnUrl(url: string): boolean {
  try {
    const target = new URL(PAYMENT_RETURN_URL);
    const current = new URL(url);
    return (
      current.origin === target.origin &&
      current.pathname.startsWith(target.pathname)
    );
  } catch {
    return url.startsWith(PAYMENT_RETURN_URL);
  }
}

export function logPayment(message: string, extra?: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }

  if (extra) {
    console.log(`[Payment] ${message}`, extra);
    return;
  }

  console.log(`[Payment] ${message}`);
}
