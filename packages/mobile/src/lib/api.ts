import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.medialink.com.gh/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const TOKEN_KEY = 'medialink_access_token';
const REFRESH_KEY = 'medialink_refresh_token';

export async function storeTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// Request interceptor — attach Bearer
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — auto-refresh
let refreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && !refreshing) {
      original._retry = true;
      refreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });

        const newAccess: string = data.data.accessToken;
        const newRefresh: string | undefined = data.data.refreshToken;
        await SecureStore.setItemAsync(TOKEN_KEY, newAccess);
        if (newRefresh) await SecureStore.setItemAsync(REFRESH_KEY, newRefresh);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        await clearTokens();
        // Navigation to login happens in app store / auth listener
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
