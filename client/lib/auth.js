'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('pos_token')) { setReady(true); return; }
    api('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('pos_token')).finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('pos_token', r.data.token);
    setUser(r.data.user);
  }, []);
  const logout = useCallback(() => { localStorage.removeItem('pos_token'); setUser(null); }, []);

  return <Ctx.Provider value={{ user, ready, login, logout, isAdmin: user?.role === 'Admin' }}>{children}</Ctx.Provider>;
}
