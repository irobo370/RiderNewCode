import { apiGet, apiPatch } from "../api/apiClient";
import { PROFILE_ENDPOINTS } from "../config/apiEndPoint";
import type { ProfileData, UpdateProfilePayload } from "../api/types";

export const getProfile = (): Promise<ProfileData> => {
  return apiGet<ProfileData>(PROFILE_ENDPOINTS.Profile);
};

export const patchProfile = (
  payload: UpdateProfilePayload,
): Promise<ProfileData> => {
  return apiPatch<ProfileData>(PROFILE_ENDPOINTS.Profile, payload);
};
