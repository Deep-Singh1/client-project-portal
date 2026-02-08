// FILE: src/lib/store.ts
import type { SessionUser } from "@/lib/auth";
import { emitDbUpdated } from "@/lib/dbEvents";

// -------- Types --------
export type ProjectStatus = "Active" | "On hold" | "Completed";

export type Project = {
  id: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  updatedAt: string;
  clientEmail: string;
  consultantEmails: string[];
};

// ✅ include "In review" because UI uses it
export type TicketStatus = "Open" | "In progress" | "In review" | "Done" | "Blocked";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type Ticket = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

export type MilestoneStatus =
  | "Planned"
  | "In progress"
  | "Ready for approval"
  | "Approved";

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  progress: number; // 0..100
  status: MilestoneStatus;
};

export type DocCategory = "Contract" | "Design" | "Report";

export type Doc = {
  id: string;
  projectId: string;
  title: string;
  category: DocCategory;
  tags: string[];
  uploadedAt: string;
};

export type Notification = {
  id: string;
  toEmail: string;
  message: string;
  createdAt: string;
  read: boolean;
};

// -------- LocalStorage Keys --------
const KEY = "cpp_db_v1";
const DB_VERSION = 1;

export type DB = {
  version: number;
  projects: Project[];
  tickets: Ticket[];
  milestones: Milestone[];
  docs: Doc[];
  notifications: Notification[];
  comments: TicketComment[];
};

// -------- Seed Data (first time only) --------
function seed(): DB {
  const now = new Date().toISOString().slice(0, 10);

  const projects: Project[] = [
    {
      id: "p1",
      name: "Website Redesign",
      customer: "Acme GmbH",
      status: "Active",
      updatedAt: now,
      clientEmail: "client@demo.com",
      consultantEmails: ["consultant@demo.com"],
    },
    {
      id: "p2",
      name: "Client Analytics Setup",
      customer: "Nordlicht AG",
      status: "On hold",
      updatedAt: now,
      clientEmail: "client@demo.com",
      consultantEmails: ["consultant@demo.com"],
    },
    {
      id: "p3",
      name: "Mobile App MVP",
      customer: "BlueWhale Ltd",
      status: "Completed",
      updatedAt: now,
      clientEmail: "anotherclient@demo.com",
      consultantEmails: ["consultant@demo.com"],
    },
  ];

  const tickets: Ticket[] = [
    {
      id: "t1",
      projectId: "p1",
      title: "Create new homepage layout",
      description: "Make a clean hero section and improve navigation.",
      status: "In progress",
      priority: "High",
      assigneeEmail: "consultant@demo.com",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t2",
      projectId: "p1",
      title: "Fix mobile menu bugs",
      description: "Menu closes randomly on iPhone Safari.",
      status: "Open",
      priority: "Medium",
      assigneeEmail: "consultant@demo.com",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const comments: TicketComment[] = [
    {
      id: "c1",
      ticketId: "t1",
      authorEmail: "consultant@demo.com",
      body: "Started working on the hero section. Will share preview soon.",
      createdAt: now,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: "m1",
      projectId: "p1",
      title: "Design approved",
      dueDate: "2026-02-10",
      progress: 90,
      status: "Ready for approval",
    },
    {
      id: "m2",
      projectId: "p1",
      title: "Development complete",
      dueDate: "2026-03-01",
      progress: 40,
      status: "In progress",
    },
  ];

  const docs: Doc[] = [
    {
      id: "d1",
      projectId: "p1",
      title: "Project contract.pdf",
      category: "Contract",
      tags: ["legal"],
      uploadedAt: "2026-01-05",
    },
    {
      id: "d2",
      projectId: "p1",
      title: "Homepage wireframes.png",
      category: "Design",
      tags: ["figma", "wireframe"],
      uploadedAt: "2026-02-01",
    },
  ];

  const notifications: Notification[] = [
    {
      id: "n1",
      toEmail: "consultant@demo.com",
      message: "Welcome! You have been assigned to Website Redesign.",
      createdAt: now,
      read: false,
    },
  ];

  return { version: DB_VERSION, projects, tickets, milestones, docs, notifications, comments };
}

// -------- Helpers --------
function safeParseDB(raw: string): DB | null {
  try {
    return JSON.parse(raw) as DB;
  } catch {
    return null;
  }
}

function loadDB(): DB {
  if (typeof window === "undefined") return seed(); // SSR safety

  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  }

  const parsed = safeParseDB(raw);
  if (!parsed) {
    const fresh = seed();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (!parsed.version || parsed.version !== DB_VERSION) {
    const fresh = seed();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tickets) || !Array.isArray(parsed.milestones)) {
    const fresh = seed();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (!Array.isArray(parsed.comments)) parsed.comments = [];
  if (!Array.isArray(parsed.docs)) parsed.docs = [];
  if (!Array.isArray(parsed.notifications)) parsed.notifications = [];

  const bad = parsed.projects.some((p: any) => !p?.id);
  if (bad) {
    const fresh = seed();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  return parsed;
}

function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  emitDbUpdated();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// -------- RBAC helpers (used by secureStore wrapper) --------
export function getVisibleProjects(session: SessionUser | null): Project[] {
  const db = loadDB();
  if (!session) return [];
  if (session.role === "admin") return db.projects;

  if (session.role === "consultant") {
    return db.projects.filter((p) => p.consultantEmails.includes(session.email));
  }

  return db.projects.filter((p) => p.clientEmail === session.email);
}

export function getProjectById(projectId: string): Project | null {
  const db = loadDB();
  return db.projects.find((p) => p.id === projectId) ?? null;
}

export function canAccessProject(session: SessionUser | null, project: Project) {
  if (!session) return false;
  if (session.role === "admin") return true;
  if (session.role === "consultant") return project.consultantEmails.includes(session.email);
  return project.clientEmail === session.email;
}

// -------- Tickets --------
export function getTickets(projectId: string): Ticket[] {
  const db = loadDB();
  return db.tickets.filter((t) => t.projectId === projectId);
}

export function getTicketById(ticketId: string): Ticket | null {
  const db = loadDB();
  return db.tickets.find((t) => t.id === ticketId) ?? null;
}

export function createTicket(input: Omit<Ticket, "id" | "createdAt" | "updatedAt">): Ticket {
  const db = loadDB();
  const now = today();

  const ticket: Ticket = {
    ...input,
    id: uid("t"),
    createdAt: now,
    updatedAt: now,
  };

  db.tickets.unshift(ticket);

  const project = db.projects.find((p) => p.id === input.projectId);
  if (project) project.updatedAt = now;

  saveDB(db);
  return ticket;
}

export function updateTicket(ticketId: string, patch: Partial<Ticket>): Ticket | null {
  const db = loadDB();
  const idx = db.tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;

  db.tickets[idx] = { ...db.tickets[idx], ...patch, updatedAt: today() };

  const project = db.projects.find((p) => p.id === db.tickets[idx].projectId);
  if (project) project.updatedAt = today();

  saveDB(db);
  return db.tickets[idx];
}

export function deleteTicket(ticketId: string): boolean {
  const db = loadDB();
  const before = db.tickets.length;
  db.tickets = db.tickets.filter((t) => t.id !== ticketId);
  saveDB(db);
  return db.tickets.length !== before;
}

// -------- Ticket comments --------
export function getTicketComments(ticketId: string): TicketComment[] {
  const db = loadDB();
  return db.comments.filter((c) => c.ticketId === ticketId);
}

export function addTicketComment(ticketId: string, authorEmail: string, body: string): TicketComment {
  const db = loadDB();

  const comment: TicketComment = {
    id: uid("c"),
    ticketId,
    authorEmail,
    body,
    createdAt: today(),
  };

  db.comments.unshift(comment);

  const tIdx = db.tickets.findIndex((t) => t.id === ticketId);
  if (tIdx !== -1) {
    db.tickets[tIdx].updatedAt = today();
    const project = db.projects.find((p) => p.id === db.tickets[tIdx].projectId);
    if (project) project.updatedAt = today();
  }

  saveDB(db);
  return comment;
}

// -------- Milestones --------
export function getMilestones(projectId: string): Milestone[] {
  const db = loadDB();
  return db.milestones.filter((m) => m.projectId === projectId);
}

export function getMilestoneById(milestoneId: string): Milestone | null {
  const db = loadDB();
  return db.milestones.find((m) => m.id === milestoneId) ?? null;
}

export function updateMilestone(milestoneId: string, patch: Partial<Milestone>): Milestone | null {
  const db = loadDB();
  const idx = db.milestones.findIndex((m) => m.id === milestoneId);
  if (idx === -1) return null;

  db.milestones[idx] = { ...db.milestones[idx], ...patch };
  saveDB(db);
  return db.milestones[idx];
}

export function approveMilestone(milestoneId: string, approvedByEmail: string): Milestone | null {
  const db = loadDB();
  const ms = db.milestones.find((m) => m.id === milestoneId);
  if (!ms) return null;

  ms.status = "Approved";
  ms.progress = Math.max(ms.progress, 100);

  const project = db.projects.find((p) => p.id === ms.projectId);
  const to = project?.consultantEmails?.[0];

  if (to) {
    db.notifications.unshift({
      id: uid("n"),
      toEmail: to,
      message: `Milestone "${ms.title}" was approved by ${approvedByEmail}.`,
      createdAt: today(),
      read: false,
    });
  }

  if (project) project.updatedAt = today();

  saveDB(db);
  return ms;
}

// -------- Documents --------
export function getDocs(projectId: string): Doc[] {
  const db = loadDB();
  return db.docs.filter((d) => d.projectId === projectId);
}

export function getDocById(docId: string): Doc | null {
  const db = loadDB();
  return db.docs.find((d) => d.id === docId) ?? null;
}

export function createDoc(input: Omit<Doc, "id" | "uploadedAt">): Doc {
  const db = loadDB();
  const now = today();

  const doc: Doc = {
    ...input,
    id: uid("d"),
    uploadedAt: now,
  };

  db.docs.unshift(doc);

  const project = db.projects.find((p) => p.id === input.projectId);
  if (project) project.updatedAt = now;

  saveDB(db);
  return doc;
}

export function updateDoc(docId: string, patch: Partial<Doc>): Doc | null {
  const db = loadDB();
  const idx = db.docs.findIndex((d) => d.id === docId);
  if (idx === -1) return null;

  db.docs[idx] = { ...db.docs[idx], ...patch };

  const project = db.projects.find((p) => p.id === db.docs[idx].projectId);
  if (project) project.updatedAt = today();

  saveDB(db);
  return db.docs[idx];
}

export function deleteDoc(docId: string): boolean {
  const db = loadDB();
  const before = db.docs.length;

  const existing = db.docs.find((d) => d.id === docId);
  db.docs = db.docs.filter((d) => d.id !== docId);

  if (existing) {
    const project = db.projects.find((p) => p.id === existing.projectId);
    if (project) project.updatedAt = today();
  }

  saveDB(db);
  return db.docs.length !== before;
}

// -------- Notifications --------
export function getNotifications(session: SessionUser | null): Notification[] {
  const db = loadDB();
  if (!session) return [];
  if (session.role === "admin") return db.notifications;
  return db.notifications.filter((n) => n.toEmail === session.email);
}

export function markNotificationRead(id: string): Notification | null {
  const db = loadDB();
  const n = db.notifications.find((x) => x.id === id);
  if (!n) return null;
  n.read = true;
  saveDB(db);
  return n;
}
