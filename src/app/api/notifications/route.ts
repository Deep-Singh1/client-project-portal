// FILE: src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth } from "@/lib/apiGuards";

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const notifications = await prisma.notification.findMany({
      where: { recipientEmail: session.email },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        readAt: true,
        projectId: true,
      },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        createdAt: toDateOnly(n.createdAt),
        read: Boolean(n.readAt),
        readAt: n.readAt ? toDateOnly(n.readAt) : null,
        projectId: n.projectId ?? null,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/notifications failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
