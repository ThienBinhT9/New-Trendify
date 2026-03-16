import { EStorageContants, TokenStorage } from "@/interfaces/common.interface";

export const getSessionStorageItem = (key: string) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Session get error:", error);
    return null;
  }
};

export const setSessionStorageItem = <T>(key: string, value: T) => {
  try {
    const jsonValue = JSON.stringify(value);
    sessionStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error("Session set error:", error);
  }
};

export const removeSessionStorageItem = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Session remove error:", error);
  }
};

export const getLocalStorageItem = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Session get error:", error);
    return null;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T) => {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error("Session set error:", error);
  }
};

export const removeLocalStorageItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Session remove error:", error);
  }
};

export const getStorageTokens = (): TokenStorage => {
  const accessToken = getLocalStorageItem(EStorageContants.ACCESS_TOKEN);

  return { accessToken };
};

export const setStorageTokens = (tokens: TokenStorage): void => {
  setLocalStorageItem(EStorageContants.ACCESS_TOKEN, tokens.accessToken);
};

export const removeStorageTokens = (): void => {
  removeLocalStorageItem(EStorageContants.ACCESS_TOKEN);
};

export const getDeviceId = (): string => {
  let deviceId = getLocalStorageItem(EStorageContants.DEVICE_ID);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    setLocalStorageItem(EStorageContants.DEVICE_ID, deviceId);
  }

  return deviceId;
};
