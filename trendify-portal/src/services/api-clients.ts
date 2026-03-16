/* eslint-disable @typescript-eslint/no-explicit-any */
import { AUTH_ENPOINT } from "@/stores/auth/constants";
import { convertToCamelCase, convertToSnakeCase } from "@/utils/common.util";
import { getDeviceId, getStorageTokens, removeStorageTokens } from "@/utils/storage.util";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { persistor } from "@/stores";
import store from "@/stores";
import { refreshTokenAction } from "@/stores/auth/actions";
import { isPublicPath } from "@/utils/auth.util";
import { reset as resetAuth } from "@/stores/auth/slice";
import { reset as resetSetting } from "@/stores/settings/slice";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const URL_SNAKECASE_IGNORE = [""];

const handleLogout = async () => {
  // 1. Clear storage tokens
  removeStorageTokens();

  if (isPublicPath(window.location.pathname)) {
    return;
  }
  // 2. reset redux store (clear persisted state)
  await persistor.purge();
  store.dispatch(resetAuth());
  store.dispatch(resetSetting());
};

const requestHandler = (config: InternalAxiosRequestConfig) => {
  const { accessToken } = getStorageTokens();

  const deviceId = getDeviceId();
  config.headers["x-device-id"] = deviceId;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
};

const responseErrorHandler = async (err: AxiosError) => {
  const status = err?.response?.status;
  const originalRequest = err?.config;

  if (status === 401 && originalRequest) {
    if (originalRequest.url?.includes(AUTH_ENPOINT.REFRESH_TOKEN)) {
      await handleLogout();
      processQueue(err.response?.data);
      return Promise.reject(err.response?.data);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => client(originalRequest))
        .catch((error) => Promise.reject(error));
    }

    isRefreshing = true;

    try {
      await store.dispatch(refreshTokenAction());

      const { accessToken } = getStorageTokens();
      if (!accessToken) {
        throw new Error("No token received after refresh");
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue();

      return client(originalRequest);
    } catch (refreshError) {
      await handleLogout();
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  if (status === 403) {
    return Promise.reject({
      message: "You do not have permission to perform this action",
      status: 403,
    });
  }
  if (status === 404) {
    return Promise.reject({
      message: "Resource not found",
      status: 404,
    });
  }
  if (status && status >= 500) {
    return Promise.reject({
      message: "Server error occurred. Please try again later.",
      status,
    });
  }

  return Promise.reject(
    err.response?.data || {
      message: "An unexpected error occurred",
      status: status || 500,
    },
  );
};

client.interceptors.request.use(
  (config) => {
    const findUrl = URL_SNAKECASE_IGNORE.find((url) => config.url?.includes(url));

    if (config.data && !(config.data instanceof FormData) && !findUrl) {
      config.data = convertToSnakeCase(config.data);
    }
    return requestHandler(config);
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use((response) => {
  response.data = convertToCamelCase(response.data);
  return response;
}, responseErrorHandler);

export default client;
