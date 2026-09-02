import { apiGet, apiPost } from "../api/apiClient";
import { PAYMENT_GATEWAY_ENDPOINTS } from "../config/apiEndPoint";
import { ApiError } from "../api/types";
import type {
  GatewayPaymentMethod,
  InitiatePaymentData,
  InitiatePaymentRequest,
  PaymentMethodCode,
  PaymentReceipt,
  PaymentStatusData,
} from "../api/types";
import { logPayment } from "../../constants/paymentGateway";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseGatewayMethod(item: unknown): GatewayPaymentMethod | null {
  if (!isRecord(item)) {
    return null;
  }

  const name = typeof item.name === "string" ? item.name.trim() : "";
  const code = typeof item.code === "string" ? item.code.trim() : "";
  if (!name || !code) {
    return null;
  }

  return {
    name,
    code: code as PaymentMethodCode,
    is_enabled: item.is_enabled === true,
  };
}

export async function getGatewayPaymentMethods(): Promise<GatewayPaymentMethod[]> {
  logPayment("Fetching payment methods");
  const data = await apiGet<GatewayPaymentMethod[] | unknown>(
    PAYMENT_GATEWAY_ENDPOINTS.Methods,
  );

  const list = Array.isArray(data) ? data : [];
  return list
    .map(parseGatewayMethod)
    .filter((method): method is GatewayPaymentMethod => method != null)
    .filter((method) => method.is_enabled);
}

export function initiatePayment(
  request: InitiatePaymentRequest,
): Promise<InitiatePaymentData> {
  logPayment("Initiating payment");
  return apiPost<InitiatePaymentData>(PAYMENT_GATEWAY_ENDPOINTS.Initiate, request);
}

export function getPaymentStatus(paymentId: string): Promise<PaymentStatusData> {
  return apiGet<PaymentStatusData>(PAYMENT_GATEWAY_ENDPOINTS.Status(paymentId));
}

/**
 * BLOCKED — Backend receipt endpoint required.
 * Do not invent a URL. Wire this once the contract is provided.
 */
export function getPaymentReceipt(_paymentId: string): Promise<PaymentReceipt> {
  return Promise.reject(
    new ApiError(
      "Payment receipt is not available yet.",
      "RECEIPT_ENDPOINT_MISSING",
    ),
  );
}
