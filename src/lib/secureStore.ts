// FILE: src/lib/secureStore.ts
import type { SessionUser } from "@/lib/auth";

import {
  // TYPES
  type Project,
  type ProjectStatus,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type TicketComment,
  type Milestone,
  type MilestoneStatus,
  type Doc,
  type DocCategory,
  type Notification,

  // UNSAFE STORE FNS
  getVisibleProjects as unsafeGetVisibleProjects,
  getProjectById as unsafeGetProjectById,
  canAccessProject as unsafeCanAccessProject,

  getTickets as unsafeGetTickets,
  getTicketById as unsafeGetTicketById,
  createTicket as unsafeCreateTicket,
  updateTicket as unsafeUpdateTicket,
  deleteTicket as unsafeDeleteTicket,

  getTicketComments as unsafeGetTicketComments,
  addTicketComment as unsafeAddTicketComment,

  getMilestones as unsafeGetMilestones,
  getMilestoneById as unsafeGetMilestoneById,
  updateMilestone as unsafeUpdateMilestone,
  approveMilestone as unsafeApproveMilestone,

  getDocs as unsafeGetDocs,
  getDocById as unsafeGetDocById,
  createDoc as unsafeCreateDoc,
  updateDoc as unsafeUpdateDoc,
  deleteDoc as unsafeDeleteDoc,

  getNotifications as unsafeGetNotifications,
  markNotificationRead as unsafeMarkNotificationRead,
} from "@/lib/store";

/**
 * Secure wrapper:
 * - every fn takes session
 * - every read/write checks project access
 * - writes enforce basic role rules
 */

function requireSession(session: SessionUser | null): SessionUser {
  if (!session) throw new Error("Not authenticated");
  return session;
}

function requireProjectAccess(session: SessionUser, projectId: string): Project {
  const project = unsafeGetProjectById(projectId);
  if (!project) throw new Error("Project not found");
  if (!unsafeCanAccessProject(session, project)) throw new Error("Access denied");
  return project;
}

function isAdminOrConsultant(session: SessionUser) {
  return session.role === "admin" || session.role === "consultant";
}
function isAdminOrClient(session: SessionUser) {
  return session.role === "admin" || session.role === "client";
}

// ---------------- Projects ----------------
export function getVisibleProjects(session: SessionUser | null): Project[] {
  const s = requireSession(session);
  return unsafeGetVisibleProjects(s);
}

export function getProject(session: SessionUser | null, projectId: string): Project | null {
  const s = requireSession(session);
  try {
    return requireProjectAccess(s, projectId);
  } catch {
    return null;
  }
}

// ---------------- Tickets (by project) ----------------
export function getTickets(session: SessionUser | null, projectId: string): Ticket[] {
  const s = requireSession(session);
  requireProjectAccess(s, projectId);
  return unsafeGetTickets(projectId);
}

export function createTicket(
  session: SessionUser | null,
  input: Omit<Ticket, "id" | "createdAt" | "updatedAt">
): Ticket {
  const s = requireSession(session);
  const project = requireProjectAccess(s, input.projectId);

  // allow client to create but restrict assignee
  if (s.role === "client") {
    const safeAssignee = project.consultantEmails?.[0] ?? input.assigneeEmail;
    return unsafeCreateTicket({ ...input, assigneeEmail: safeAssignee });
  }

  return unsafeCreateTicket(input);
}

export function updateTicket(
  session: SessionUser | null,
  ticketId: string,
  patch: Partial<Ticket>
): Ticket | null {
  const s = requireSession(session);
  const ticket = unsafeGetTicketById(ticketId);
  if (!ticket) return null;

  requireProjectAccess(s, ticket.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can edit tickets");
  }

  return unsafeUpdateTicket(ticketId, patch);
}

export function deleteTicket(session: SessionUser | null, ticketId: string): boolean {
  const s = requireSession(session);
  const ticket = unsafeGetTicketById(ticketId);
  if (!ticket) return false;

  requireProjectAccess(s, ticket.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can delete tickets");
  }

  return unsafeDeleteTicket(ticketId);
}

// ---------------- Ticket detail + comments ----------------
export function getTicket(session: SessionUser | null, ticketId: string): Ticket | null {
  const s = requireSession(session);
  const ticket = unsafeGetTicketById(ticketId);
  if (!ticket) return null;

  requireProjectAccess(s, ticket.projectId);
  return ticket;
}

export function getTicketComments(session: SessionUser | null, ticketId: string): TicketComment[] {
  const s = requireSession(session);
  const ticket = unsafeGetTicketById(ticketId);
  if (!ticket) return [];

  requireProjectAccess(s, ticket.projectId);
  return unsafeGetTicketComments(ticketId);
}

export function addTicketComment(
  session: SessionUser | null,
  ticketId: string,
  body: string
): TicketComment {
  const s = requireSession(session);

  const ticket = unsafeGetTicketById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  requireProjectAccess(s, ticket.projectId);

  const cleaned = body.trim();
  if (!cleaned) throw new Error("Comment cannot be empty");

  return unsafeAddTicketComment(ticketId, s.email, cleaned);
}

// ---------------- Milestones ----------------
export function getMilestones(session: SessionUser | null, projectId: string): Milestone[] {
  const s = requireSession(session);
  requireProjectAccess(s, projectId);
  return unsafeGetMilestones(projectId);
}

export function updateMilestone(
  session: SessionUser | null,
  milestoneId: string,
  patch: Partial<Milestone>
): Milestone | null {
  const s = requireSession(session);

  const ms = unsafeGetMilestoneById(milestoneId);
  if (!ms) return null;

  requireProjectAccess(s, ms.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can edit milestones");
  }

  return unsafeUpdateMilestone(milestoneId, patch);
}

export function approveMilestone(session: SessionUser | null, milestoneId: string): Milestone | null {
  const s = requireSession(session);

  if (!isAdminOrClient(s)) {
    throw new Error("Only clients/admins can approve milestones");
  }

  const ms = unsafeGetMilestoneById(milestoneId);
  if (!ms) return null;

  requireProjectAccess(s, ms.projectId);

  return unsafeApproveMilestone(milestoneId, s.email);
}

// ---------------- Documents ----------------
export function getDocs(session: SessionUser | null, projectId: string): Doc[] {
  const s = requireSession(session);
  requireProjectAccess(s, projectId);
  return unsafeGetDocs(projectId);
}

export function createDoc(session: SessionUser | null, input: Omit<Doc, "id" | "uploadedAt">): Doc {
  const s = requireSession(session);
  requireProjectAccess(s, input.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can add documents");
  }

  return unsafeCreateDoc(input);
}

export function updateDoc(session: SessionUser | null, docId: string, patch: Partial<Doc>): Doc | null {
  const s = requireSession(session);

  const doc = unsafeGetDocById(docId);
  if (!doc) return null;

  requireProjectAccess(s, doc.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can edit documents");
  }

  return unsafeUpdateDoc(docId, patch);
}

export function deleteDoc(session: SessionUser | null, docId: string): boolean {
  const s = requireSession(session);

  const doc = unsafeGetDocById(docId);
  if (!doc) return false;

  requireProjectAccess(s, doc.projectId);

  if (!isAdminOrConsultant(s)) {
    throw new Error("Only consultants/admins can delete documents");
  }

  return unsafeDeleteDoc(docId);
}

// ---------------- Notifications ----------------
export function getNotifications(session: SessionUser | null): Notification[] {
  const s = requireSession(session);
  return unsafeGetNotifications(s);
}

export function markNotificationRead(session: SessionUser | null, id: string) {
  const s = requireSession(session);

  const mine = unsafeGetNotifications(s).find((n) => n.id === id);
  if (!mine) throw new Error("Notification not found");

  return unsafeMarkNotificationRead(id);
}

// Re-export types so pages can import from here
export type {
  Project,
  ProjectStatus,
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketComment,
  Milestone,
  MilestoneStatus,
  Doc,
  DocCategory,
  Notification,
};
