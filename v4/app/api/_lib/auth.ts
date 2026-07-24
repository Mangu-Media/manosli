// Auth helpers: scrypt password hashing + HMAC-SHA256 JWT, both built on
// node:crypto so the API ships zero extra runtime dependencies (no `jose`).
import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import type { ApiRequest } from './http';

// promisify loses the `options` overload — restore it explicitly.
const scrypt = promisify(_scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number },
) => Promise<Buffer>;

// ── Password hashing (scrypt) ────────────────────────────────────
const SCRYPT_N = 16384;
const KEY_LEN = 64;

/** Hash a password → `scrypt$N$saltHex$hashHex`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEY_LEN, { N: SCRYPT_N })) as Buffer;
  return `scrypt$${SCRYPT_N}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** Constant-time verify of a password against a stored scrypt hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const salt = Buffer.from(parts[2], 'hex');
  const expected = Buffer.from(parts[3], 'hex');
  if (!Number.isInteger(n) || salt.length === 0 || expected.length === 0) return false;
  const derived = (await scrypt(password, salt, expected.length, { N: n })) as Buffer;
  return timingSafeEqual(derived, expected);
}

// ── JWT (HS256, compact serialization) ───────────────────────────
export interface TokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  iat: number;
  exp: number;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? 'manosli-dev-secret-do-not-use-in-prod';
}

const b64url = (buf: Buffer | string): string =>
  Buffer.from(buf).toString('base64url');

function signSegment(data: string): string {
  return createHmac('sha256', jwtSecret()).update(data).digest('base64url');
}

/** Sign a session token for a user. */
export function signToken(user: { id: string; email: string; name: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const head = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(
    JSON.stringify(payload),
  )}`;
  return `${head}.${signSegment(head)}`;
}

/** Verify a token; returns the payload or null (bad signature / expired). */
export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const head = `${parts[0]}.${parts[1]}`;
  const sig = parts[2];
  const expected = signSegment(head);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as TokenPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Request-level auth ───────────────────────────────────────────
/** Extract the Bearer token payload from a request, or null. */
export function getAuth(req: ApiRequest): TokenPayload | null {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  return verifyToken(match[1].trim());
}

export function newUserId(): string {
  return randomUUID();
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export const isValidEmail = (email: unknown): email is string =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export const isValidPassword = (password: unknown): password is string =>
  typeof password === 'string' && password.length >= 8 && password.length <= 256;
