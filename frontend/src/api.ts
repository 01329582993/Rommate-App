import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export async function getStoredToken() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  }
  return SecureStore.getItemAsync('userToken');
}

export async function saveAuthSession(token: string, user: any) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
    }
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync('userToken', token),
    SecureStore.setItemAsync('userData', JSON.stringify(user)),
  ]);
}

export async function clearAuthSession() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    }
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync('userToken'),
    SecureStore.deleteItemAsync('userData'),
  ]);
}

export async function getStoredUser() {
  if (Platform.OS === 'web') {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
    return raw ? JSON.parse(raw) : null;
  }
  const raw = await SecureStore.getItemAsync('userData');
  return raw ? JSON.parse(raw) : null;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const token = await getStoredToken();
  const headers = new Headers(options.headers as HeadersInit | undefined);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const body =
    options.body instanceof FormData
      ? options.body
      : typeof options.body === 'string'
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined;

  console.log(`[API] ${options.method || 'GET'} ${path}`, {
    headers: Object.fromEntries(headers.entries()),
    body: options.body,
    stringifiedBody: body
  });

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  console.log(`[API RESPONSE] ${response.status}`, data);

  return { response, data };
}
