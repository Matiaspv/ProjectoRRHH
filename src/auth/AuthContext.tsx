import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '../domain/types';
import { bootstrapAdmin, changeOwnPassword, login as doLogin } from '../services/store';

const IDLE_MS = 15 * 60_000; // OWASP A07: cierre por inactividad
const KEY = 'rrhh.session';

interface AuthCtx {
  session: Session | null;
  login: (u: string, p: string) => Promise<void>;
  setup: (u: string, p: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// sessionStorage: la sesión muere al cerrar la pestaña. Producción: cookie HttpOnly+Secure+SameSite emitida por el servidor.
const load = (): Session | null => {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null; } catch { return null; }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(load);

  const logout = useCallback(() => { sessionStorage.removeItem(KEY); setSession(null); }, []);

  const start = (s: Session) => { sessionStorage.setItem(KEY, JSON.stringify(s)); setSession(s); };

  useEffect(() => {
    if (!session) return;
    let t = window.setTimeout(logout, IDLE_MS);
    const reset = () => { window.clearTimeout(t); t = window.setTimeout(logout, IDLE_MS); };
    const events = ['click', 'keydown', 'mousemove'] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    return () => { window.clearTimeout(t); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [session, logout]);

  const value = useMemo<AuthCtx>(() => ({
    session,
    login: async (u, p) => start(await doLogin(u, p)),
    setup: async (u, p) => { await bootstrapAdmin(u, p); start(await doLogin(u, p)); },
    changePassword: async (current, next) => {
      if (session) start(await changeOwnPassword(session, current, next));
    },
    logout,
  }), [session, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = (): AuthCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
};
