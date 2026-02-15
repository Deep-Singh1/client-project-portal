// FILE: src/app/api/projects/[projectId]/milestones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  requireAuth,
  requireProjectAccess,
  requireManage,
  requireApprove,
} from "@/lib/apiGuards";
import {
  MilestoneStatusLabel,
  dateOnlyISO,
  parseDateOnlyToUTC,
} from "@/lib/enumMaps";

import { readJson, validateBody } from "@/lib/apiValidation";
import { MilestonePatchSchema } from "@/lib/requestSchemas";

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

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        dueDate: true,
        progress: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      milestones: milestones.map((m) => ({
        ...m,
        dueDate: dateOnlyISO(m.dueDate),
        status: MilestoneStatusLabel[m.status],
        createdAt: dateOnlyISO(m.createdAt),
        updatedAt: dateOnlyISO(m.updatedAt),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/projects/[projectId]/milestones failed:", err);
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

    const { projectId } = await params;
    if (!projectId) return jsonError(400, "Missing projectId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const body = await readJson(req);
    const v = validateBody(MilestonePatchSchema, body);
    if (!v.ok) return v.response;

    const id = v.data.id;

    const existing = await prisma.milestone.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Milestone not found");
    if (existing.projectId !== projectId) {
      return jsonError(400, "Milestone does not belong to this project");
    }

    // Role checks
    const manage = requireManage(session);
    const approve = requireApprove(session);

    // ---- Clients: approve only ----
    if (!manage.ok) {
      if (!approve.ok) return jsonError(403, "Forbidden");

      // Must explicitly approve
      if (v.data.status !== "APPROVED") {
        return jsonError(403, "Forbidden: clients can only approve milestones");
      }

      const progress = typeof v.data.progress === "number" ? v.data.progress : 100;

      const updated = await prisma.milestone.update({
        where: { id },
        data: { status: "APPROVED", progress },
        select: {
          id: true,
          projectId: true,
          title: true,
          dueDate: true,
          progress: true,
          status: true,
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
        milestone: {
          ...updated,
          dueDate: dateOnlyISO(updated.dueDate),
          status: MilestoneStatusLabel[updated.status],
          createdAt: dateOnlyISO(updated.createdAt),
          updatedAt: dateOnlyISO(updated.updatedAt),
        },
      });
    }

    // ---- Managers (consultant/admin): editable fields ----
    const dueDate =
      typeof v.data.dueDate === "string" ? parseDateOnlyToUTC(v.data.dueDate) : undefined;

    // Empty update guard (if user sends only {id})
    const hasChanges =
      v.data.title !== undefined ||
      v.data.dueDate !== undefined ||
      v.data.progress !== undefined ||
      v.data.status !== undefined;

    if (!hasChanges) return jsonError(400, "Empty update body");

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        title: v.data.title,
        dueDate,
        progress: v.data.progress,
        status: (v.data.status as any) ?? undefined,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        dueDate: true,
        progress: true,
        status: true,
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
      milestone: {
        ...updated,
        dueDate: dateOnlyISO(updated.dueDate),
        status: MilestoneStatusLabel[updated.status],
        createdAt: dateOnlyISO(updated.createdAt),
        updatedAt: dateOnlyISO(updated.updatedAt),
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/projects/[projectId]/milestones failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
