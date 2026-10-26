import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredToken, getStoredUser, saveAuthSession, clearAuthSession, apiRequest, setUnauthorizedHandler } from './api';

type Result = { ok: boolean; message?: string; user?: any };

interface AuthContextType {
  token: string | null;
  user: any | null;
  hasProfile: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (input: { name: string; email: string; password: string; gender?: string; studentId?: string }) => Promise<Result>;
  logout: () => Promise<void>;
  setHasProfile: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setToken(null);
    setUser(null);
    setHasProfile(true);
  }, []);

  // Session expired / account removed -> back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // true = profile exists, false = needs onboarding. On network trouble we assume it exists
  // so a flaky connection never traps someone in onboarding.
  const checkProfileStatus = async (): Promise<boolean> => {
    try {
      const { response } = await apiRequest('/api/profile/me');
      if (response.status === 404) return false;
      return true;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setHasProfile(await checkProfileStatus());
        }
      } catch (e) {
        console.warn('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const startSession = async (data: any): Promise<Result> => {
    await saveAuthSession(data.token, data.user);
    setUser(data.user);
    setToken(data.token);
    setHasProfile(await checkProfileStatus());
    return { ok: true, user: data.user };
  };

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    try {
      const { response, data } = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
      if (response.ok && data?.token) return await startSession(data);
      return { ok: false, message: data?.message || 'Login failed' };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Could not connect to the server' };
    }
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string; gender?: string }): Promise<Result> => {
    try {
      const { response, data } = await apiRequest('/api/auth/register', { method: 'POST', body: input });
      if (response.ok && data?.token) return await startSession(data);
      return { ok: false, message: data?.message || 'Could not create your account' };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Could not connect to the server' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, hasProfile, isLoading, login, register, logout, setHasProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
