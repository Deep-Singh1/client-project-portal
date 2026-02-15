// FILE: src/app/api/projects/[projectId]/docs/[docId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireProjectAccess, requireManage } from "@/lib/apiGuards";
import { DocCategoryLabel, dateOnlyISO, parseDateOnlyToUTC } from "@/lib/enumMaps";

import { readJson, validateBody } from "@/lib/apiValidation";
import { DocUpdateSchema } from "@/lib/requestSchemas";

type Ctx = { params: Promise<{ projectId?: string; docId?: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const { projectId, docId } = await params;
    if (!projectId || !docId) return jsonError(400, "Missing projectId or docId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const existing = await prisma.doc.findUnique({
      where: { id: docId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Doc not found");
    if (existing.projectId !== projectId) return jsonError(400, "Doc does not belong to this project");

    const body = await readJson(req);
    const v = validateBody(DocUpdateSchema, body);
    if (!v.ok) return v.response;

    if (Object.keys(v.data).length === 0) return jsonError(400, "Empty update body");

    const uploadedAt =
      typeof v.data.uploadedAt === "string" ? parseDateOnlyToUTC(v.data.uploadedAt) : undefined;

    const updated = await prisma.doc.update({
      where: { id: docId },
      data: {
        title: v.data.title,
        category: (v.data.category as any) ?? undefined,
        tags: v.data.tags,
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
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        category: DocCategoryLabel[updated.category],
        tags: updated.tags,
        uploadedAt: dateOnlyISO(updated.uploadedAt),
        createdAt: dateOnlyISO(updated.createdAt),
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/projects/[projectId]/docs/[docId] failed:", err);
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

    const { projectId, docId } = await params;
    if (!projectId || !docId) return jsonError(400, "Missing projectId or docId");

    const access = await requireProjectAccess(projectId, session);
    if (!access.ok) return jsonError(access.status, access.message);

    const manage = requireManage(session);
    if (!manage.ok) return jsonError(manage.status, manage.message);

    const existing = await prisma.doc.findUnique({
      where: { id: docId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError(404, "Doc not found");
    if (existing.projectId !== projectId) return jsonError(400, "Doc does not belong to this project");

    await prisma.doc.delete({ where: { id: docId } });

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/projects/[projectId]/docs/[docId] failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
