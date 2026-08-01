import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { getToken, setToken, setUnauthorizedHandler } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  // On first load, if a token is already stored, confirm it's still valid
  // (not expired, account still active) by fetching the current user.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    (async () => {
      const existingToken = getToken();
      if (!existingToken) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        setUser(data.data);
      } catch {
        clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [clearSession]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  };

  const refreshProfile = async () => {
    const { data } = await authApi.me();
    setUser(data.data);
    return data.data;
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthenticated: Boolean(user), isBootstrapping, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
