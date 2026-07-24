// Auth session module for the manosli+ player.
// Token + profile persist in localStorage under `manosli.session.v1` so the
// session survives reloads. Everything works without a backend: when the API
// is unreachable (static preview / offline), signup/login surface a clear
// error and the app simply stays in local mode.
import { useSyncExternalStore } from 'react';

const SESSION_KEY = 'manosli.session.v1';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

type Listener = () => void;

let session: AuthSession | null = loadSession();
const listeners = new Set<Listener>();

function loadSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.user !== 'object' ||
      parsed.user === null ||
      typeof parsed.user.id !== 'string' ||
      typeof parsed.user.email !== 'string'
    ) {
      return null;
    }
    return {
      token: parsed.token,
      user: {
        id: parsed.user.id,
        email: parsed.user.email,
        name: typeof parsed.user.name === 'string' ? parsed.user.name : parsed.user.email,
      },
    };
  } catch {
    return null;
  }
}

function setSession(next: AuthSession | null): void {
  session = next;
  try {
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable — session lives in memory only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSession(): AuthSession | null {
  return session;
}

export function getToken(): string | null {
  return session?.token ?? null;
}

export function logout(): void {
  // The library's local mirror (LocalStorageRepository) is intentionally kept,
  // so the user's likes/playlists survive logout on this device.
  setSession(null);
}

export class AuthError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface AuthResponse {
  token?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}

async function postAuth(path: string, body: Record<string, unknown>): Promise<AuthSession> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('offline', 'Cannot reach the server — check your connection.');
  }
  let data: AuthResponse = {};
  try {
    data = (await res.json()) as AuthResponse;
  } catch {
    // Non-JSON error body (e.g. static host 404 page).
  }
  if (!res.ok || typeof data.token !== 'string' || !data.user) {
    if (data.error === 'database_not_configured') {
      throw new AuthError('database_not_configured', 'Sync is not enabled on this deployment yet.');
    }
    if (data.error === 'email_taken') {
      throw new AuthError('email_taken', 'That email is already registered — try signing in.');
    }
    if (data.error === 'invalid_credentials') {
      throw new AuthError('invalid_credentials', 'Wrong email or password.');
    }
    throw new AuthError(
      data.error ?? 'unknown',
      data.message ?? (res.ok ? 'Unexpected server response.' : `Sign-in failed (${res.status}).`),
    );
  }
  const next: AuthSession = { token: data.token, user: data.user };
  setSession(next);
  return next;
}

export function signup(email: string, password: string, name?: string): Promise<AuthSession> {
  return postAuth('/api/auth/signup', { email, password, name });
}

export function login(email: string, password: string): Promise<AuthSession> {
  return postAuth('/api/auth/login', { email, password });
}

export interface OAuthResult {
  status: 'ok' | 'coming_soon' | 'error';
  message?: string;
}

/**
 * Google / Apple sign-in. The API returns 501 `not_configured` until the
 * provider client id is set up server-side — we surface that as a friendly
 * "coming soon" instead of an error.
 */
export async function oauthSignIn(provider: 'google' | 'apple'): Promise<OAuthResult> {
  let res: Response;
  try {
    res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, token: 'placeholder-id-token' }),
    });
  } catch {
    return { status: 'error', message: 'Cannot reach the server — check your connection.' };
  }
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    token?: string;
    user?: AuthUser;
  };
  if (res.ok && typeof data.token === 'string' && data.user) {
    setSession({ token: data.token, user: data.user });
    return { status: 'ok' };
  }
  if (data.error === 'not_configured' || data.error === 'not_implemented') {
    return {
      status: 'coming_soon',
      message: `${provider === 'google' ? 'Google' : 'Apple'} sign-in is coming soon — use email for now.`,
    };
  }
  return { status: 'error', message: 'Sign-in failed. Please try again.' };
}

/** React hook: current session, plus auth actions. */
export function useAuth(): {
  session: AuthSession | null;
  user: AuthUser | null;
  signup: typeof signup;
  login: typeof login;
  logout: typeof logout;
  oauthSignIn: typeof oauthSignIn;
} {
  const current = useSyncExternalStore(subscribe, getSession);
  return { session: current, user: current?.user ?? null, signup, login, logout, oauthSignIn };
}
