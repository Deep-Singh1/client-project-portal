// FILE: src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth } from "@/lib/apiGuards";
import { ProjectStatusLabel, dateOnlyISO } from "@/lib/enumMaps";

export async function GET() {
  try {
    const session = await requireAuth().catch((e) => {
      if (String(e?.message) === "UNAUTHENTICATED") return null;
      throw e;
    });
    if (!session) return jsonError(401, "Unauthenticated");

    const role = String(session.role ?? "").toUpperCase(); // ✅ normalize

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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      projects: projects.map((p) => ({
        ...p,
        status: ProjectStatusLabel[p.status],
        createdAt: dateOnlyISO(p.createdAt),
        updatedAt: dateOnlyISO(p.updatedAt),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/projects failed:", err);
    return jsonError(500, err?.message ?? "Server error");
  }
}
