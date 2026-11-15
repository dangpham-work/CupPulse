'use client';

import type { LoginInput, LoginResult, PublicUser, RegisterInput } from '@brewlite/shared';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiRequestError, apiRequest, type ApiOptions, type ApiResult } from '@/lib/api';

const STORAGE_KEY = 'brewhouse.session.v1';

interface Session {
  token: string;
  user: PublicUser;
  /** Mốc hết hạn (ms epoch) tính ở client theo expiresIn. */
  expiresAt: number;
}

interface AuthValue {
  /** false cho tới khi đọc xong localStorage, tránh nhấp nháy "chưa đăng nhập". */
  ready: boolean;
  user: PublicUser | null;
  token: string | null;
  login: (input: LoginInput) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => void;
  /** Gọi API có Bearer; token hết hạn hoặc bị từ chối (401) thì xóa phiên và chuyển tới /login?returnUrl (AC-10.5). */
  request: <T>(path: string, options?: ApiOptions) => Promise<ApiResult<T>>;
}

const AuthContext = createContext<AuthValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.token && s.user && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* bỏ qua: private mode */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const store = useCallback((next: Session | null) => {
    writeSession(next);
    setSession(next);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await apiRequest<LoginResult>('/auth/login', { method: 'POST', body: input });
      store({ token: data.accessToken, user: data.user, expiresAt: Date.now() + data.expiresIn * 1000 });
      return data.user;
    },
    [store],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await apiRequest<PublicUser>('/auth/register', { method: 'POST', body: input });
    return data;
  }, []);

  const logout = useCallback(() => {
    store(null);
    router.push('/');
  }, [store, router]);

  const request = useCallback(
    async <T,>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> => {
      const current = readSession();
      if (!current) {
        store(null);
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        throw new ApiRequestError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn');
      }
      try {
        return await apiRequest<T>(path, { ...options, token: current.token });
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          store(null);
          router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
        throw error;
      }
    },
    [store, router, pathname],
  );

  const value = useMemo<AuthValue>(
    () => ({ ready, user: session?.user ?? null, token: session?.token ?? null, login, register, logout, request }),
    [ready, session, login, register, logout, request],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
