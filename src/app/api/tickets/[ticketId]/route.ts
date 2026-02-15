// FILE: src/app/api/tickets/[ticketId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess, requireManage } from "@/lib/apiGuards";
import {
  TicketStatusLabel,
  TicketPriorityLabel,
  parseTicketStatus,
  parseTicketPriority,
  dateOnlyISO,
} from "@/lib/enumMaps";

type Ctx = { params: Promise<{ ticketId?: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { ticketId } = await params;
    if (!ticketId) return jsonError(400, "Missing ticketId");

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
        project: { select: { clientEmail: true, consultantEmails: true } },
      },
    });

    if (!ticket) return jsonError(404, "Ticket not found");

    const access = await requireProjectAccess(ticket.projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    return NextResponse.json({
      ok: true,
      ticket: {
        id: ticket.id,
        projectId: ticket.projectId,
        title: ticket.title,
        description: ticket.description,
        status: TicketStatusLabel[ticket.status],
        priority: TicketPriorityLabel[ticket.priority],
        assigneeEmail: ticket.assigneeEmail,
        createdAt: dateOnlyISO(ticket.createdAt),
        updatedAt: dateOnlyISO(ticket.updatedAt),
        project: ticket.project,
      },
    });
  } catch (err: any) {
    console.error("GET /api/tickets/[ticketId] failed:", err);
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

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const { ticketId } = await params;
    if (!ticketId) return jsonError(400, "Missing ticketId");

    const existing = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Ticket not found");

    const access = await requireProjectAccess(existing.projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const body = await req.json().catch(() => null);

    const parsedStatus =
      typeof body?.status === "string" ? parseTicketStatus(body.status) : null;
    const parsedPriority =
      typeof body?.priority === "string" ? parseTicketPriority(body.priority) : null;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        title: typeof body?.title === "string" ? body.title.trim() : undefined,
        description: typeof body?.description === "string" ? body.description.trim() : undefined,
        status: parsedStatus ?? undefined,
        priority: parsedPriority ?? undefined,
        assigneeEmail: typeof body?.assigneeEmail === "string" ? body.assigneeEmail.trim() : undefined,
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
        project: { select: { clientEmail: true, consultantEmails: true } },
      },
    });

    await prisma.project.update({
      where: { id: existing.projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      ticket: {
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        description: updated.description,
        status: TicketStatusLabel[updated.status],
        priority: TicketPriorityLabel[updated.priority],
        assigneeEmail: updated.assigneeEmail,
        createdAt: dateOnlyISO(updated.createdAt),
        updatedAt: dateOnlyISO(updated.updatedAt),
        project: updated.project,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/tickets/[ticketId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
