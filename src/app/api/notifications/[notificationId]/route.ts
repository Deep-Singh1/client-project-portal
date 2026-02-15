// FILE: src/app/api/notifications/[notificationId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth } from "@/lib/apiGuards";

import { readJson, validateBody } from "@/lib/apiValidation";
import { NotificationPatchSchema } from "@/lib/requestSchemas";

type Ctx = { params: Promise<{ notificationId?: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { notificationId } = await params;
    if (!notificationId) return jsonError(400, "Missing notificationId");

    const body = await readJson(req);
    const v = validateBody(NotificationPatchSchema, body);
    if (!v.ok) return v.response;

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, recipientEmail: true },
    });

    if (!existing) return jsonError(404, "Notification not found");

    const isOwner =
      String(existing.recipientEmail).toLowerCase() === String(session.email).toLowerCase();
    const isAdmin = session.role === "admin";

    if (!isOwner && !isAdmin) return jsonError(403, "Forbidden");

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      select: { id: true, readAt: true },
    });

    return NextResponse.json({
      ok: true,
      notification: {
        id: updated.id,
        readAt: updated.readAt ? updated.readAt.toISOString().slice(0, 10) : null,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/notifications/[notificationId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
