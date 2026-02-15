// FILE: src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeSessionCookie } from "@/lib/serverSession";
import { verifyPassword } from "@/lib/password";

function prismaRoleToSessionRole(role: string) {
  // Prisma: ADMIN | CONSULTANT | CLIENT
  // Session: "admin" | "consultant" | "client"
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "CONSULTANT") return "consultant";
  return "client";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email) {
    return NextResponse.json({ ok: false, error: { message: "Email required" } }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ ok: false, error: { message: "Password required" } }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true, passwordHash: true },
  });

  // ✅ do NOT reveal whether email exists
  if (!user) {
    return NextResponse.json({ ok: false, error: { message: "Invalid credentials" } }, { status: 401 });
  }

  // If you migrated but didn't seed, this will still be ""
  if (!user.passwordHash) {
    return NextResponse.json(
      { ok: false, error: { message: "Account not initialized. Run db:seed." } },
      { status: 500 }
    );
  }

  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: { message: "Invalid credentials" } }, { status: 401 });
  }

  const role = prismaRoleToSessionRole(user.role);

  const cookieValue = makeSessionCookie({ email: user.email, role });

  const res = NextResponse.json({ ok: true, session: { email: user.email, role } });

  res.cookies.set("cpp_session", cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
