// FILE: src/app/api/projects/[projectId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth } from "@/lib/apiGuards";
import { ProjectStatusLabel, dateOnlyISO } from "@/lib/enumMaps";
import { canSeeProject } from "@/lib/serverSession";

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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        customer: true,
        clientEmail: true,
        consultantEmails: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) return jsonError(404, "Project not found");
    if (!canSeeProject(project, session)) return jsonError(403, "Forbidden");

    return NextResponse.json({
      ok: true,
      project: {
        ...project,
        status: ProjectStatusLabel[project.status],
        createdAt: dateOnlyISO(project.createdAt),
        updatedAt: dateOnlyISO(project.updatedAt),
      },
    });
  } catch (err: any) {
    console.error("GET /api/projects/[projectId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
