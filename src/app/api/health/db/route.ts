import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("DB health check failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "DB error" },
      { status: 500 }
    );
  }
}
