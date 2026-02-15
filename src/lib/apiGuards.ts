// FILE: src/lib/apiGuards.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canSeeProject, canManage, canApprove } from "@/lib/serverSession";

export type ApiSession = {
  email: string;
  role: "client" | "consultant" | "admin";
};

// ✅ supports optional details (used by Zod validation)
export function jsonError(status: number, message: string, details?: any) {
  return NextResponse.json(
    { ok: false, error: { message, ...(details ? { details } : {}) } },
    { status }
  );
}

export async function requireAuth(): Promise<ApiSession> {
  const session = await requireSession().catch(() => null);
  if (!session) throw new Error("UNAUTHENTICATED");
  return session as ApiSession;
}

export async function requireProjectAccess(projectId: string, session: ApiSession) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientEmail: true, consultantEmails: true },
  });

  if (!project) return { ok: false as const, status: 404, message: "Project not found" };
  if (!canSeeProject(project, session))
    return { ok: false as const, status: 403, message: "Forbidden" };

  return { ok: true as const, project };
}

export function requireManage(session: ApiSession) {
  if (!canManage(session)) return { ok: false as const, status: 403, message: "Forbidden" };
  return { ok: true as const };
}

export function requireApprove(session: ApiSession) {
  if (!canApprove(session)) return { ok: false as const, status: 403, message: "Forbidden" };
  return { ok: true as const };
}
