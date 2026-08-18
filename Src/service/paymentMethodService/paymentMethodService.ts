import { apiGet, apiPost } from "../api/apiClient";
import { PAYMENT_ENDPOINTS } from "../config/apiEndPoint";
import type { CreatePaymentMethodPayload, PaymentMethod } from "../api/types";

export const listPaymentMethods = (): Promise<PaymentMethod[]> => {
  return apiGet<PaymentMethod[]>(PAYMENT_ENDPOINTS.List);
};

export const createPaymentMethod = (
  payload: CreatePaymentMethodPayload,
): Promise<PaymentMethod> => {
  return apiPost<PaymentMethod>(PAYMENT_ENDPOINTS.List, payload);
};
