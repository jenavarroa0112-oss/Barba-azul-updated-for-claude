import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { ENV } from "./_core/env";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export const ADMIN_COOKIE_NAME = "barba_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type AdminSession = { role: "admin" };

// ---------------------------------------------------------------------------
// Password hashing — Node's built-in scrypt, no extra dependency.
// Stored format: "<saltHex>:<hashHex>". The plaintext password is never
// stored anywhere, only this salted hash (see ADMIN_PASSWORD_HASH in .env).
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = await scrypt(password, salt, expected.length);
    // timingSafeEqual requires equal-length buffers, and itself runs in
    // constant time — together these prevent a timing side-channel from
    // leaking how many leading bytes of the password guess were correct.
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Login attempt throttling, per IP.
//
// NOTE: this is in-memory, so it only works correctly on a single server
// instance. If you ever scale this app to more than one instance (multiple
// dynos/containers behind a load balancer), move this to a shared store
// (Redis, or a `login_attempts` table) — otherwise each instance has its
// own counter and an attacker effectively gets `instances × MAX_ATTEMPTS` tries.
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isLoginLocked(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedLogin(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

// ---------------------------------------------------------------------------
// Credential check
// ---------------------------------------------------------------------------

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (!ENV.adminPasswordHash) {
    console.warn("[Admin] ADMIN_PASSWORD_HASH is not configured — login is disabled.");
    return false;
  }
  // Always run the password hash even when the username is already wrong,
  // so a bad username doesn't return measurably faster than a bad password
  // — that timing gap is enough for an attacker to enumerate usernames.
  const passwordOk = await verifyPassword(password, ENV.adminPasswordHash);
  const usernameOk = username === ENV.adminUsername;
  return usernameOk && passwordOk;
}

// ---------------------------------------------------------------------------
// Session JWT — signed/verified locally with JWT_SECRET. No external calls.
// ---------------------------------------------------------------------------

function getSecretKey() {
  if (!ENV.jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return new TextEncoder().encode(ENV.jwtSecret);
}

export async function createAdminSessionToken(): Promise<string> {
  const expSeconds = Math.floor((Date.now() + SESSION_TTL_MS) / 1000);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expSeconds)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function getAdminCookieOptions(req: Request) {
  const isHttps = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    // Secure is forced on in production. In dev over plain http, we relax it
    // so localhost testing still works.
    secure: ENV.isProduction ? true : isHttps,
    // Strict: this cookie is never needed for a cross-site request (no
    // third-party embeds, no cross-site links that should carry the
    // session), so the strongest CSRF-resistant setting is the right one.
    sameSite: "strict" as const,
    path: "/",
  };
}

export function setAdminCookie(req: Request, res: Response, token: string) {
  res.cookie(ADMIN_COOKIE_NAME, token, { ...getAdminCookieOptions(req), maxAge: SESSION_TTL_MS });
}

export function clearAdminCookie(req: Request, res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, { ...getAdminCookieOptions(req), maxAge: -1 });
}

export function getClientIp(req: Request): string {
  return req.ip ?? "unknown";
}
