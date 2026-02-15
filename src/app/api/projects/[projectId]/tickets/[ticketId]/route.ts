// FILE: src/app/api/projects/[projectId]/tickets/[ticketId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess, requireManage } from "@/lib/apiGuards";
import { TicketStatusLabel, TicketPriorityLabel, dateOnlyISO } from "@/lib/enumMaps";

import { readJson, validateBody } from "@/lib/apiValidation";
import { TicketUpdateSchema } from "@/lib/requestSchemas";

type Ctx = { params: Promise<{ projectId?: string; ticketId?: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId, ticketId } = await params;
    if (!projectId || !ticketId) return jsonError(400, "Missing projectId or ticketId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
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

    if (!ticket) return jsonError(404, "Ticket not found");
    if (ticket.projectId !== projectId) return jsonError(400, "Ticket does not belong to this project");

    return NextResponse.json({
      ok: true,
      ticket: {
        ...ticket,
        status: TicketStatusLabel[ticket.status],
        priority: TicketPriorityLabel[ticket.priority],
        createdAt: dateOnlyISO(ticket.createdAt),
        updatedAt: dateOnlyISO(ticket.updatedAt),
      },
    });
  } catch (err: any) {
    console.error("GET /api/projects/[projectId]/tickets/[ticketId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId, ticketId } = await params;
    if (!projectId || !ticketId) return jsonError(400, "Missing projectId or ticketId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const existing = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Ticket not found");
    if (existing.projectId !== projectId) return jsonError(400, "Ticket does not belong to this project");

    const body = await readJson(req);
    const v = validateBody(TicketUpdateSchema, body);
    if (!v.ok) return v.response;

    // ✅ Reject empty updates (or unknown-only bodies that get stripped)
    if (Object.keys(v.data).length === 0) return jsonError(400, "Empty update body");

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        title: v.data.title,
        description: v.data.description,
        status: (v.data.status as any) ?? undefined,
        priority: (v.data.priority as any) ?? undefined,
        assigneeEmail: v.data.assigneeEmail,
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
        ...updated,
        status: TicketStatusLabel[updated.status],
        priority: TicketPriorityLabel[updated.priority],
        createdAt: dateOnlyISO(updated.createdAt),
        updatedAt: dateOnlyISO(updated.updatedAt),
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/projects/[projectId]/tickets/[ticketId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId, ticketId } = await params;
    if (!projectId || !ticketId) return jsonError(400, "Missing projectId or ticketId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const existing = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Ticket not found");
    if (existing.projectId !== projectId) return jsonError(400, "Ticket does not belong to this project");

    await prisma.ticket.delete({ where: { id: ticketId } });

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/projects/[projectId]/tickets/[ticketId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
