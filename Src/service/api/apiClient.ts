import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import SecureStorage from "../../utils/SecureStorage";
import { clearAuthStateAndGoToLogin } from "../../utils/authSession";
import AUTH_ENDPOINTS from "../config/apiEndPoint";
import { ApiError, type ApiResponse, type TokenData } from "./types";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://go4ride.org";

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processRefreshQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
}

function getErrorPayload(error: AxiosError<ApiResponse<unknown>>) {
  const body = error.response?.data;
  const errorData =
    body?.data && typeof body.data === "object" && "code" in body.data
      ? body.data
      : undefined;

  return new ApiError(
    body?.message ?? error.message ?? "Request failed",
    typeof errorData?.code === "string" ? errorData.code : undefined,
    error.response?.status,
  );
}

async function refreshAccessToken(client: AxiosInstance): Promise<string> {
  const refreshToken = await SecureStorage.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("No refresh token", "INVALID_REFRESH_TOKEN", 401);
  }

  const response = await client.post<ApiResponse<TokenData>>(
    AUTH_ENDPOINTS.Refresh,
    { refresh_token: refreshToken },
  );

  const body = response.data;
  if (
    !body.success ||
    !body.data ||
    typeof body.data !== "object" ||
    "code" in body.data
  ) {
    throw new ApiError(
      body.message ?? "Token refresh failed",
      "INVALID_REFRESH_TOKEN",
      401,
    );
  }

  const tokenData = body.data as TokenData;
  const { access_token, refresh_token, user_id } = tokenData;
  await SecureStorage.saveAccessToken(access_token);
  await SecureStorage.saveRefreshToken(refresh_token);
  if (user_id) {
    await SecureStorage.saveUserId(user_id);
  }

  return access_token;
}

async function handleUnauthorized(
  client: AxiosInstance,
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
) {
  if (originalRequest._retry) {
    await clearAuthStateAndGoToLogin();
    throw new ApiError("Session expired", "UNAUTHORIZED", 401);
  }

  if (isRefreshing) {
    const token = await new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return client(originalRequest);
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken(client);
    processRefreshQueue(null, newToken);
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return client(originalRequest);
  } catch (error) {
    processRefreshQueue(error, null);
    await clearAuthStateAndGoToLogin();
    throw error;
  } finally {
    isRefreshing = false;
  }
}

function unwrapResponse<T>(body: ApiResponse<T>): T {
  if (!body.success) {
    const errorData =
      body.data && typeof body.data === "object" && "code" in body.data
        ? body.data
        : undefined;
    throw new ApiError(
      body.message,
      typeof errorData?.code === "string" ? errorData.code : undefined,
    );
  }

  return body.data as T;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log("\n===== API REQUEST =====");
      console.log("URL:", `${config.baseURL}${config.url}`);
      console.log("METHOD:", config.method?.toUpperCase());
      console.log("BODY:", JSON.stringify(config.data, null, 2));
      console.log("========================\n");
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("\n===== API RESPONSE =====");
      console.log("URL:", response.config.url);
      console.log("STATUS:", response.status);
      console.log("DATA:", JSON.stringify(response.data, null, 2));
      console.log("========================\n");
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    if (__DEV__) {
      console.log("\n===== API ERROR =====");
      console.log("URL:", error.config?.url);
      console.log("STATUS:", error.response?.status);
      console.log("DATA:", JSON.stringify(error.response?.data, null, 2));
      console.log("========================\n");
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/verify-otp") &&
      !originalRequest.url?.includes("/auth/request-otp")
    ) {
      return handleUnauthorized(axiosClient, originalRequest);
    }

    return Promise.reject(getErrorPayload(error));
  },
);

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosClient.get<ApiResponse<T>>(url, config);
  return unwrapResponse(response.data);
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosClient.post<ApiResponse<T>>(url, data, config);
  return unwrapResponse(response.data);
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosClient.patch<ApiResponse<T>>(url, data, config);
  return unwrapResponse(response.data);
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosClient.delete<ApiResponse<T>>(url, config);
  return unwrapResponse(response.data);
}

export function getWsBaseUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (base.startsWith("https://")) {
    return base.replace("https://", "wss://");
  }
  if (base.startsWith("http://")) {
    return base.replace("http://", "ws://");
  }
  return base;
}

export default axiosClient;
