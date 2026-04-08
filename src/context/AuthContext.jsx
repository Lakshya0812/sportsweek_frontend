/**
 * Authentication context — provides login/logout state throughout the app.
 * Persists tokens to localStorage so the session survives page refresh.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const isStaff = localStorage.getItem('is_staff') === 'true';
    return token ? { username, isStaff } : null;
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.login({ username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('username', data.username);
    localStorage.setItem('is_staff', String(data.is_staff));
    setUser({ username: data.username, isStaff: data.is_staff });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_staff');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
