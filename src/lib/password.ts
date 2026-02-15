// FILE: src/lib/password.ts
import crypto from "crypto";

/**
 * We store hashes in this format:
 *   scrypt$N$r$p$saltB64$hashB64
 *
 * This is:
 * - secure (salted + slow)
 * - dependency-free (Node crypto)
 * - future-proof (params embedded)
 */

const DEFAULT_SCRYPT = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 32;
const SALT_LEN = 16;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password, salt, KEYLEN, DEFAULT_SCRYPT);
  const saltB64 = salt.toString("base64");
  const hashB64 = hash.toString("base64");
  return `scrypt$${DEFAULT_SCRYPT.N}$${DEFAULT_SCRYPT.r}$${DEFAULT_SCRYPT.p}$${saltB64}$${hashB64}`;
}

export function verifyPassword(password: string, stored: string) {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6) return false;

    const [algo, nStr, rStr, pStr, saltB64, hashB64] = parts;
    if (algo !== "scrypt") return false;

    const N = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    if (salt.length < 8 || expected.length !== KEYLEN) return false;

    const actual = crypto.scryptSync(password, salt, KEYLEN, { N, r, p });

    // constant-time compare
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
