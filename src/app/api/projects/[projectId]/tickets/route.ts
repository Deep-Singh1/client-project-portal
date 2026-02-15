// FILE: src/app/api/projects/[projectId]/tickets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess, requireManage } from "@/lib/apiGuards";
import { TicketStatusLabel, TicketPriorityLabel, dateOnlyISO } from "@/lib/enumMaps";

import { readJson, validateBody } from "@/lib/apiValidation";
import { TicketCreateSchema } from "@/lib/requestSchemas";

type Ctx = { params: Promise<{ projectId?: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId } = await params;
    if (!projectId) return jsonError(400, "Missing projectId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const tickets = await prisma.ticket.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      tickets: tickets.map((t) => ({
        ...t,
        status: TicketStatusLabel[t.status],
        priority: TicketPriorityLabel[t.priority],
        createdAt: dateOnlyISO(t.createdAt),
        updatedAt: dateOnlyISO(t.updatedAt),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/projects/[projectId]/tickets failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId } = await params;
    if (!projectId) return jsonError(400, "Missing projectId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const body = await readJson(req);
    const v = validateBody(TicketCreateSchema, body);
    if (!v.ok) return v.response;

    const created = await prisma.ticket.create({
      data: {
        projectId,
        title: v.data.title,
        description: v.data.description ?? "",
        status: (v.data.status as any) ?? "OPEN",
        priority: (v.data.priority as any) ?? "MEDIUM",
        assigneeEmail: v.data.assigneeEmail ?? undefined,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      ticket: {
        ...created,
        status: TicketStatusLabel[created.status],
        priority: TicketPriorityLabel[created.priority],
        createdAt: dateOnlyISO(created.createdAt),
        updatedAt: dateOnlyISO(created.updatedAt),
      },
    });
  } catch (err: any) {
    console.error("POST /api/projects/[projectId]/tickets failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
