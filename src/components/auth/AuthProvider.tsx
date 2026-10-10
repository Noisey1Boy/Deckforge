'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * AuthProvider — thin client-side session context for DeckForge AI.
 *
 * Consumes the auth API contract (owned by the backend agent — do NOT change
 * shapes here):
 *   GET  /api/auth/me       → { user: null } | { user: { id, name, email, createdAt } }
 *   POST /api/auth/signup   { name, email, password } → { user } | { error }
 *   POST /api/auth/login    { email, password }       → { user } | { error }
 *   POST /api/auth/logout   → { ok: true }
 *   POST /api/auth/password { current, next }         → { ok: true } | { error }
 *
 * The session itself is an httpOnly cookie; this provider only mirrors who is
 * signed in so the UI (header, settings, auth pages) can react. Any network
 * failure (including the endpoints not existing yet) degrades to a guest.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the first /api/auth/me roundtrip settles. */
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** POST JSON and unwrap `{ user }` / `{ error }` per the auth contract. */
async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* non-JSON error body — fall through to the generic message */
  }
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Request failed (HTTP ${res.status})`,
    );
  }
  return data;
}

function asUser(value: unknown): AuthUser {
  const u = (value ?? {}) as Partial<AuthUser>;
  return {
    id: String(u.id ?? ''),
    name: String(u.name ?? ''),
    email: String(u.email ?? ''),
    createdAt: String(u.createdAt ?? ''),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = (await res.json()) as { user?: AuthUser | null };
        const next = data.user ? asUser(data.user) : null;
        setUser(next);
        return next;
      }
      setUser(null);
      return null;
    } catch {
      // Endpoint missing / network hiccup → degrade to guest, never crash.
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const data = await postJson('/api/auth/login', { email, password });
    const u = asUser(data.user);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      const data = await postJson('/api/auth/signup', { name, email, password });
      const u = asUser(data.user);
      setUser(u);
      return u;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await postJson('/api/auth/logout', {});
    } finally {
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (current: string, next: string): Promise<void> => {
    await postJson('/api/auth/password', { current, next });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, login, signup, logout, changePassword }),
    [user, loading, refresh, login, signup, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
