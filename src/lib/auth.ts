// FILE: src/lib/auth.ts
import { emitDbUpdated } from "@/lib/dbEvents";

export type Role = "client" | "consultant" | "admin";

export type SessionUser = {
  email: string;
  role: Role;
};

const KEY = "cpp_session";
const KEY_PING = "cpp_session_updated_at";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function pingSessionUpdate() {
  // Cross-tab ping: triggers 'storage' in other tabs
  // (writing a changing value ensures the event fires)
  try {
    localStorage.setItem(KEY_PING, String(Date.now()));
  } catch {
    // ignore (private mode / quota / disabled storage)
  }
}

export function setSession(user: SessionUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEY, JSON.stringify(user));
  pingSessionUpdate();

  // Same-tab update
  emitDbUpdated();
}

export function clearSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(KEY);
  pingSessionUpdate();

  // Same-tab update
  emitDbUpdated();
}

export function inferRole(email: string): Role {
  const e = email.toLowerCase();
  if (e.includes("admin")) return "admin";
  if (e.includes("consultant")) return "consultant";
  return "client";
}
