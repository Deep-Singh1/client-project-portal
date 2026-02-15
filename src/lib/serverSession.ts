// FILE: src/lib/serverSession.ts
import { cookies } from "next/headers";
import crypto from "crypto";

export type Role = "client" | "consultant" | "admin";
export type SessionUser = { email: string; role: Role };

const COOKIE_NAME = "cpp_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET in .env");
  return s;
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function unbase64url(str: string) {
  const pad = str.length % 4;
  const padded = str + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function sign(payload: string) {
  return base64url(crypto.createHmac("sha256", secret()).update(payload).digest());
}

export function makeSessionCookie(user: SessionUser) {
  const payload = JSON.stringify(user);
  const sig = sign(payload);
  return `${base64url(payload)}.${sig}`;
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies(); // ✅ in your Next version, cookies() is async
  const c = jar.get(COOKIE_NAME)?.value;
  if (!c) return null;

  const [payloadB64, sig] = c.split(".");
  if (!payloadB64 || !sig) return null;

  const payload = unbase64url(payloadB64);

  const expected = sign(payload);
  if (expected !== sig) return null;

  try {
    const obj = JSON.parse(payload);

    const email = typeof obj?.email === "string" ? obj.email.trim().toLowerCase() : "";
    const role = obj?.role;

    if (!email) return null;
    if (role !== "client" && role !== "consultant" && role !== "admin") return null;

    return { email, role };
  } catch {
    return null;
  }

}

export async function requireSession(): Promise<SessionUser> {
  const s = await readSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  if (!s.email || !s.role) throw new Error("UNAUTHENTICATED");
  return s;
}


export function canSeeProject(
  project: { clientEmail: string; consultantEmails: string[] },
  s: SessionUser
) {
  const email = String(s.email ?? "").toLowerCase();
  if (!email) return false;

  const clientEmail = String(project.clientEmail ?? "").toLowerCase();
  const consultantEmails = Array.isArray(project.consultantEmails)
    ? project.consultantEmails.map((x) => String(x).toLowerCase())
    : [];

  if (s.role === "admin") return true;
  if (s.role === "consultant") return consultantEmails.includes(email);
  return clientEmail === email;
}



export function canManage(s: SessionUser) {
  return s.role === "consultant" || s.role === "admin";
}

export function canApprove(s: SessionUser) {
  return s.role === "client" || s.role === "admin";
}
