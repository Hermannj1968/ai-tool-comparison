// Password hashing (scrypt) and cookie sessions.
import crypto from "node:crypto";

const SESSION_DAYS = 30;
export const COOKIE = "crm_session";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function newSession(repo, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString().replace("T", " ").slice(0, 19);
  repo.createSession(token, userId, expires);
  return token;
}

export function sessionCookie(token, { secure }) {
  const parts = [`${COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${SESSION_DAYS * 86400}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie({ secure }) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function readCookie(req, name = COOKIE) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

// Very small in-memory brute-force guard for the login endpoint.
const attempts = new Map();
export function loginAllowed(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > 15 * 60e3) return true;
  return entry.count < 10;
}
export function recordFailedLogin(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > 15 * 60e3) attempts.set(key, { first: now, count: 1 });
  else entry.count++;
}
export function clearLoginAttempts(key) {
  attempts.delete(key);
}
