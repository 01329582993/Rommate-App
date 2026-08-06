import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredToken, getStoredUser, saveAuthSession, clearAuthSession, apiRequest } from './api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  hasProfile: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHasProfile: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const checkProfileStatus = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/profile/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to check profile status:', e);
      return true; // Fallback to true to avoid routing loops on network error
    }
  };

  useEffect(() => {
    // Load stored session on startup
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          const hasProf = await checkProfileStatus(storedToken);
          setHasProfile(hasProf);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { response, data } = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.ok && data.token) {
        await saveAuthSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        const hasProf = await checkProfileStatus(data.token);
        setHasProfile(hasProf);
        return { ok: true };
      }
      return { ok: false, message: data?.message || 'Login failed' };
    } catch (e: any) {
      return { ok: false, message: 'Could not connect to server' };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: { idToken: 'demo-google-token' },
      });

      if (response.ok && data.token) {
        await saveAuthSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        const hasProf = await checkProfileStatus(data.token);
        setHasProfile(hasProf);
        return { ok: true };
      }
      return { ok: false, message: data?.message || 'Google login failed' };
    } catch (e: any) {
      return { ok: false, message: 'Could not connect to server' };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setToken(null);
    setUser(null);
    setHasProfile(true);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedUser = await getStoredUser();
    if (storedUser) setUser(storedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, hasProfile, isLoading, login, loginWithGoogle, logout, refreshUser, setHasProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
