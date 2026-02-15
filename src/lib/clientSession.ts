// FILE: src/lib/clientSession.ts
export type Role = "client" | "consultant" | "admin";
export type SessionUser = { email: string; role: Role };

export async function getServerSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) return null;

  const s = data.session;
  if (!s?.email || !s?.role) return null;

  return { email: String(s.email), role: s.role as Role };
}
