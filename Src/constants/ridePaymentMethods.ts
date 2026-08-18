import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type RidePaymentMethodId =
  | "mpesa"
  | "airtel_money"
  | "orange_money"
  | "cash"
  | "card";

export type RidePaymentMethod = {
  id: RidePaymentMethodId;
  label: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  kind: "mobile_money" | "cash" | "card";
};

export const RIDE_PAYMENT_METHODS: RidePaymentMethod[] = [
  {
    id: "mpesa",
    label: "M-Pesa",
    subtitle: "Pay from your M-Pesa wallet",
    icon: "phone-portrait-outline",
    kind: "mobile_money",
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    subtitle: "Pay from your Airtel Money wallet",
    icon: "phone-portrait-outline",
    kind: "mobile_money",
  },
  {
    id: "orange_money",
    label: "Orange Money",
    subtitle: "Pay from your Orange Money wallet",
    icon: "phone-portrait-outline",
    kind: "mobile_money",
  },
  {
    id: "cash",
    label: "Cash",
    subtitle: "Pay the driver in cash",
    icon: "cash-outline",
    kind: "cash",
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    subtitle: "Pay with a debit or credit card",
    icon: "card-outline",
    kind: "card",
  },
];
