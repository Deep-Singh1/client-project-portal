// FILE: src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { readSession } from "@/lib/serverSession";

export async function GET() {
  const session = await readSession();
  return NextResponse.json({ ok: true, session: session ?? null });
}
