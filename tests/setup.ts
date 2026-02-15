// FILE: tests/setup.ts
import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

/**
 * Minimal .env loader (no extra deps).
 * Loads .env.test first (if present), then .env.
 */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();

    // Strip wrapping quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = val;
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env.test"));
loadEnvFile(path.join(root, ".env"));

// Prefer TEST_* DB vars if you want a safe separate DB for tests
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
if (process.env.TEST_DIRECT_URL) process.env.DIRECT_URL = process.env.TEST_DIRECT_URL;

// Ensure AUTH_SECRET exists so session signing works in tests
if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = "test-secret-change-me";

// Global cookie header used by mocked next/headers cookies()
(globalThis as any).__TEST_COOKIE_HEADER__ = "";

// Mock next/headers cookies() so serverSession.ts works in Vitest
vi.mock("next/headers", () => {
  function getCookieValue(name: string, header: string) {
    // header format: "a=1; b=2; cpp_session=XYZ"
    const parts = header.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (!p) continue;
      const [k, ...rest] = p.split("=");
      if (k === name) return rest.join("="); // cookie value can include '='
    }
    return null;
  }

  return {
    cookies: async () => {
      const header = String((globalThis as any).__TEST_COOKIE_HEADER__ ?? "");
      return {
        get: (name: string) => {
          const v = getCookieValue(name, header);
          return v ? ({ value: v } as any) : undefined;
        },
      };
    },
  };
});
