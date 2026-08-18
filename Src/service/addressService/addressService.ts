import { apiDelete, apiGet, apiPatch, apiPost } from "../api/apiClient";
import { ADDRESS_ENDPOINTS } from "../config/apiEndPoint";
import type {
  CreateAddressPayload,
  SavedAddress,
  UpdateAddressPayload,
} from "../api/types";

type ListAddressesParams = {
  lat?: string;
  lng?: string;
};

export const listAddresses = (
  params?: ListAddressesParams,
): Promise<SavedAddress[]> => {
  return apiGet<SavedAddress[]>(ADDRESS_ENDPOINTS.List, { params });
};

export const createAddress = (
  payload: CreateAddressPayload,
): Promise<SavedAddress> => {
  return apiPost<SavedAddress>(ADDRESS_ENDPOINTS.List, payload);
};

export const updateAddress = (
  id: string,
  payload: UpdateAddressPayload,
): Promise<SavedAddress> => {
  return apiPatch<SavedAddress>(ADDRESS_ENDPOINTS.Detail(id), payload);
};

export const deleteAddress = (id: string): Promise<SavedAddress> => {
  return apiDelete<SavedAddress>(ADDRESS_ENDPOINTS.Detail(id));
};
