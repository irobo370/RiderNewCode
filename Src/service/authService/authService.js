import { apiDelete, apiGet, apiPost } from "../api/apiClient";
import AUTH_ENDPOINTS from "../config/apiEndPoint";

export const requestOtpService = (payload) => {
  return apiPost(AUTH_ENDPOINTS.RequestOtp, payload);
};

export const verifyOtpService = (payload) => {
  return apiPost(AUTH_ENDPOINTS.VerifyOtp, payload);
};

export const refreshTokenService = (refreshToken) => {
  return apiPost(AUTH_ENDPOINTS.Refresh, { refresh_token: refreshToken });
};

export const logoutService = (refreshToken) => {
  return apiPost(AUTH_ENDPOINTS.Logout, { refresh_token: refreshToken });
};

export const getMeService = () => {
  return apiGet(AUTH_ENDPOINTS.Me);
};

export const deleteAccountService = () => {
  return apiDelete(AUTH_ENDPOINTS.DeleteAccount);
};
