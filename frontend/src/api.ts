import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_PORT = 3000;
const LAN_HOST = '192.168.0.200';

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('127.0.0.1')) {
    return fromEnv.replace(/\/+$/, '');
  }

  // In Expo Go on LAN, hostUri contains "<your computer's LAN IP>:8081"
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && !host.includes('exp.direct') && !host.includes('ngrok')) {
    const isLoopback = host === 'localhost' || host === '127.0.0.1';
    return `http://${isLoopback && Platform.OS === 'android' ? '10.0.2.2' : host}:${API_PORT}`;
  }

  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  // When on mobile (Android/iOS) in Expo Go, route to PC's LAN IP so it never tries phone's loopback
  if (Platform.OS !== 'web') {
    return `http://${LAN_HOST}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

// ---------- session storage ----------
const isWeb = Platform.OS === 'web';

async function readItem(key: string): Promise<string | null> {
  if (isWeb) return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
}

async function writeItem(key: string, value: string) {
  if (isWeb) {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (isWeb) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken() {
  return readItem('userToken');
}

export async function getStoredUser() {
  const raw = await readItem('userData');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveAuthSession(token: string, user: any) {
  await Promise.all([writeItem('userToken', token), writeItem('userData', JSON.stringify(user))]);
}

export async function clearAuthSession() {
  await Promise.all([removeItem('userToken'), removeItem('userData')]);
}

// ---------- requests ----------
let onUnauthorized: (() => void) | null = null;

/** AuthContext registers this so an expired/invalid session sends the user back to login. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

const REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const token = await getStoredToken();
  const headers = new Headers(options.headers as HeadersInit | undefined);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const body =
    options.body instanceof FormData || typeof options.body === 'string'
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, body, signal: controller.signal });
  } catch (e: any) {
    throw new Error(
      e?.name === 'AbortError'
        ? 'The server took too long to respond.'
        : `Could not reach the server at ${API_URL}. Is the backend running and is your phone on the same Wi-Fi?`
    );
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  // A 401 on any normal request means the session is no longer valid.
  if (response.status === 401 && token && !path.startsWith('/api/auth')) {
    onUnauthorized?.();
  }

  return { response, data };
}
