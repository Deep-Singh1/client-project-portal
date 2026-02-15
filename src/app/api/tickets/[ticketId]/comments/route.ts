// FILE: src/app/api/tickets/[ticketId]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess } from "@/lib/apiGuards";
import { dateOnlyISO } from "@/lib/enumMaps";
import { readJson, validateBody } from "@/lib/apiValidation";
import { TicketCommentCreateSchema } from "@/lib/requestSchemas";

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
      select: { id: true, projectId: true },
    });
    if (!ticket) return jsonError(404, "Ticket not found");

    const access = await requireProjectAccess(ticket.projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        ticketId: true,
        authorEmail: true,
        body: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      comments: comments.map((c) => ({
        ...c,
        createdAt: dateOnlyISO(c.createdAt),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/tickets/[ticketId]/comments failed:", err);
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

    const { ticketId } = await params;
    if (!ticketId) return jsonError(400, "Missing ticketId");

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, projectId: true },
    });
    if (!ticket) return jsonError(404, "Ticket not found");

    const access = await requireProjectAccess(ticket.projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const body = await readJson(req);
    const v = validateBody(TicketCommentCreateSchema, body);
    if (!v.ok) return v.response;

    const created = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorEmail: session.email,
        body: v.data.body,
      },
      select: {
        id: true,
        ticketId: true,
        authorEmail: true,
        body: true,
        createdAt: true,
      },
    });

    // bump project activity timestamp (useful for dashboards / recency)
    await prisma.project.update({
      where: { id: ticket.projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      comment: { ...created, createdAt: dateOnlyISO(created.createdAt) },
    });
  } catch (err: any) {
    console.error("POST /api/tickets/[ticketId]/comments failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
