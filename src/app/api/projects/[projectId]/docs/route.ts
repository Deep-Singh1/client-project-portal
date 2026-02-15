// FILE: src/app/api/projects/[projectId]/docs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess, requireManage } from "@/lib/apiGuards";
import { DocCategoryLabel, dateOnlyISO, parseDateOnlyToUTC } from "@/lib/enumMaps";

import { readJson, validateBody } from "@/lib/apiValidation";
import { DocCreateSchema } from "@/lib/requestSchemas";

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

    const docs = await prisma.doc.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        category: true,
        tags: true,
        uploadedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      docs: docs.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        title: d.title,
        category: DocCategoryLabel[d.category],
        tags: d.tags,
        uploadedAt: dateOnlyISO(d.uploadedAt),
        createdAt: dateOnlyISO(d.createdAt),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/projects/[projectId]/docs failed:", err);
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
    const v = validateBody(DocCreateSchema, body);
    if (!v.ok) return v.response;

    const uploadedAtStr = v.data.uploadedAt ?? dateOnlyISO(new Date());
    const uploadedAt = parseDateOnlyToUTC(uploadedAtStr);

    const created = await prisma.doc.create({
      data: {
        projectId,
        title: v.data.title,
        category: (v.data.category as any) ?? "CONTRACT",
        tags: v.data.tags ?? [],
        uploadedAt,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        category: true,
        tags: true,
        uploadedAt: true,
        createdAt: true,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      doc: {
        id: created.id,
        projectId: created.projectId,
        title: created.title,
        category: DocCategoryLabel[created.category],
        tags: created.tags,
        uploadedAt: dateOnlyISO(created.uploadedAt),
        createdAt: dateOnlyISO(created.createdAt),
      },
    });
  } catch (err: any) {
    console.error("POST /api/projects/[projectId]/docs failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
