// FILE: src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth } from "@/lib/apiGuards";
import { ProjectStatusLabel, dateOnlyISO } from "@/lib/enumMaps";
import {
  buildDashboardProjects,
  type CountRow,
  type DashboardProjectRow,
} from "@/lib/dashboardPayload";

export async function GET() {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const role = String(session.role ?? "").toUpperCase();

    const where =
      role === "ADMIN"
        ? {}
        : {
            OR: [
              { clientEmail: session.email },
              { consultantEmails: { has: session.email } },
            ],
          };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        customer: true,
        clientEmail: true,
        consultantEmails: true,
        updatedAt: true,
      },
    });

   const projectIds = projects.map((p) => p.id);

const openTicketsGroup = await prisma.ticket.groupBy({
  by: ["projectId"],
  where: {
    projectId: { in: projectIds },
    NOT: { status: "DONE" },
  },
  _count: { _all: true },
});

const overdueMilestonesGroup = await prisma.milestone.groupBy({
  by: ["projectId"],
  where: {
    projectId: { in: projectIds },
    dueDate: { lt: new Date() },
    NOT: { status: "APPROVED" },
  },
  _count: { _all: true },
});

const openTicketCounts: CountRow[] = openTicketsGroup.map((r) => ({
  projectId: r.projectId,
  count: r._count._all,
}));

const overdueMilestoneCounts: CountRow[] = overdueMilestonesGroup.map((r) => ({
  projectId: r.projectId,
  count: r._count._all,
}));

const built = buildDashboardProjects(
  projects as unknown as DashboardProjectRow[],
  openTicketCounts,
  overdueMilestoneCounts
);

    const notifications = await prisma.notification.findMany({
      where: { recipientEmail: session.email },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        recipientEmail: true,
        projectId: true,
        type: true,
        message: true,
        createdAt: true,
        readAt: true,
      },
    });

    return NextResponse.json({
  ok: true,
  summary: built.summary,
  projects: built.projects,
  analytics: {
    openTickets: built.summary.openTickets,
    overdueMilestones: built.summary.overdueMilestones,
  },
  notifications: notifications.map((n) => ({
    ...n,
    createdAt: dateOnlyISO(n.createdAt),
    read: !!n.readAt,
    readAt: n.readAt ? dateOnlyISO(n.readAt) : null,
  })),
});

  } catch (err: any) {
    console.error("GET /api/dashboard failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
