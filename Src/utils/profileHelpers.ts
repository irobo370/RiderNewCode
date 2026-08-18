import type { PaymentMethod } from "../service/api/types";

export function formatPaymentBrandLabel(brand: string): string {
  const normalized = brand.trim().toLowerCase();

  if (normalized === "upi") {
    return "UPI";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatPaymentMethodTitle(method: PaymentMethod): string {
  const brand = formatPaymentBrandLabel(method.brand);
  return `${brand} ....${method.last4}`;
}

export function formatPaymentExpiry(method: PaymentMethod): string {
  const year = String(method.exp_year).slice(-2);
  const month = String(method.exp_month).padStart(2, "0");
  return `Expires ${month}/${year}`;
}

export function formatAddressDistance(distanceM?: number): string | null {
  if (distanceM == null) {
    return null;
  }

  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceM)} m`;
}
