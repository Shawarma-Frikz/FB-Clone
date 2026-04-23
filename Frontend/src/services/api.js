import axios from "axios";
import { clearAuthStorage, readAuthStorage, writeAuthStorage } from "./authStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

const setHeader = (headers, name, value) => {
  if (!headers) {
    return;
  }

  if (typeof headers.set === "function") {
    headers.set(name, value);
    return;
  }

  headers[name] = value;
};

const removeHeader = (headers, name) => {
  if (!headers) {
    return;
  }

  if (typeof headers.delete === "function") {
    headers.delete(name);
    return;
  }

  delete headers[name];
};

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    removeHeader(config.headers, "Content-Type");
  }

  const authState = readAuthStorage();

  if (authState?.accessToken) {
    setHeader(config.headers, "Authorization", `Bearer ${authState.accessToken}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register") || requestUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    const authState = readAuthStorage();

    if (!authState?.refreshToken) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await refreshClient.post("/auth/refresh", {
        refreshToken: authState.refreshToken
      });

      const refreshedAuth = {
        user: authState.user,
        accessToken: data?.data?.accessToken,
        refreshToken: data?.data?.refreshToken
      };

      writeAuthStorage(refreshedAuth);
      setHeader(originalRequest.headers, "Authorization", `Bearer ${refreshedAuth.accessToken}`);

      return api(originalRequest);
    } catch {
      clearAuthStorage();
      return Promise.reject(error);
    }
  }
);

export default api;