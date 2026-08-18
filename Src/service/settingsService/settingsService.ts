import { apiGet, apiPatch } from "../api/apiClient";
import { SETTINGS_ENDPOINTS } from "../config/apiEndPoint";
import type { UpdateUserSettingsPayload, UserSettings } from "../api/types";

export const getSettings = (): Promise<UserSettings> => {
  return apiGet<UserSettings>(SETTINGS_ENDPOINTS.Settings);
};

export const patchSettings = (
  payload: UpdateUserSettingsPayload,
): Promise<UserSettings> => {
  return apiPatch<UserSettings>(SETTINGS_ENDPOINTS.Settings, payload);
};
