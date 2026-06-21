/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User, type AuthResponse } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const data = await api.get<User>('/api/v1/auth/me');
      setUser(data);
    } catch {
      // Not logged in or expired session
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthResponse>('/api/v1/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Clear anyway
    } finally {
      setUser(null);
    }
  };

  const refreshSession = async () => {
    try {
      const data = await api.post<AuthResponse>('/api/v1/auth/refresh');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      checkSession();
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
