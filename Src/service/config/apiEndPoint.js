const AUTH_ENDPOINTS = {
  RequestOtp: "/api/v1/auth/request-otp",
  VerifyOtp: "/api/v1/auth/verify-otp",
  Refresh: "/api/v1/auth/refresh",
  Logout: "/api/v1/auth/logout",
  Me: "/api/v1/auth/me",
  DeleteAccount: "/api/v1/auth/account",
};

const RIDE_ENDPOINTS = {
  Quote: "/api/v1/rides/quote",
  Create: "/api/v1/rides",
  Cancel: (rideId) => `/api/v1/rides/${rideId}/cancel`,
  Detail: (rideId) => `/api/v1/rides/${rideId}`,
  Status: (rideId) => `/api/v1/rides/${rideId}/status`,
  Invoice: (rideId) => `/api/v1/rides/${rideId}/invoice`,
  History: "/api/v1/rides/history",
  Repeat: (rideId) => `/api/v1/rides/${rideId}/repeat`,
  Pay: (rideId) => `/api/v1/rides/${rideId}/pay`,
  Ws: (rideId) => `/api/v1/ws/rides/${rideId}`,
};

const PROFILE_ENDPOINTS = {
  Profile: "/api/v1/profile",
};

const ADDRESS_ENDPOINTS = {
  List: "/api/v1/addresses",
  Detail: (id) => `/api/v1/addresses/${id}`,
};

const PAYMENT_ENDPOINTS = {
  List: "/api/v1/payment-methods",
  Detail: (id) => `/api/v1/payment-methods/${id}`,
};

const SETTINGS_ENDPOINTS = {
  Settings: "/api/v1/settings",
};

const INSIGHTS_ENDPOINTS = {
  Insights: "/api/v1/insights",
};

export {
  RIDE_ENDPOINTS,
  PROFILE_ENDPOINTS,
  ADDRESS_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  SETTINGS_ENDPOINTS,
  INSIGHTS_ENDPOINTS,
};
export default AUTH_ENDPOINTS;
