// FILE: src/lib/enumMaps.ts

// ---------- DATE HELPERS ----------
export function dateOnlyISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parseDateOnlyToUTC(dateStr: string) {
  // expects "YYYY-MM-DD"
  // store as midnight UTC to avoid timezone surprises
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// ---------- TICKETS ----------
export const TicketStatusLabel = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
} as const;

export const TicketPriorityLabel = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;

export function parseTicketStatus(input: string) {
  const raw = String(input ?? "").trim();
  const up = raw.toUpperCase();
  if (up in TicketStatusLabel) return up as keyof typeof TicketStatusLabel;

  const v = raw.toLowerCase();
  if (v === "open") return "OPEN";
  if (v === "in progress" || v === "in_progress") return "IN_PROGRESS";
  if (v === "in review" || v === "in_review") return "IN_REVIEW";
  if (v === "blocked") return "BLOCKED";
  if (v === "done") return "DONE";
  return null;
}

export function parseTicketPriority(input: string) {
  const raw = String(input ?? "").trim();
  const up = raw.toUpperCase();
  if (up in TicketPriorityLabel) return up as keyof typeof TicketPriorityLabel;

  const v = raw.toLowerCase();
  if (v === "low") return "LOW";
  if (v === "medium") return "MEDIUM";
  if (v === "high") return "HIGH";
  if (v === "urgent") return "URGENT";
  return null;
}

// ---------- MILESTONES ----------
export const MilestoneStatusLabel = {
  DRAFT: "Draft",
  READY_FOR_APPROVAL: "Ready for approval",
  APPROVED: "Approved",
} as const;

export function parseMilestoneStatus(input: string) {
  const raw = String(input ?? "").trim();
  const up = raw.toUpperCase();
  if (up in MilestoneStatusLabel) return up as keyof typeof MilestoneStatusLabel;

  const v = raw.toLowerCase();
  if (v === "draft" || v === "planned") return "DRAFT";
  if (v === "ready for approval" || v === "ready_for_approval") return "READY_FOR_APPROVAL";
  if (v === "approved") return "APPROVED";
  return null;
}

// ---------- DOCS ----------
export const DocCategoryLabel = {
  CONTRACT: "Contract",
  INVOICE: "Invoice",
  TECHNICAL: "Technical",
  OTHER: "Other",
} as const;

export function parseDocCategory(input: string) {
  const raw = String(input ?? "").trim();
  const up = raw.toUpperCase();
  if (up in DocCategoryLabel) return up as keyof typeof DocCategoryLabel;

  const v = raw.toLowerCase();
  if (v === "contract") return "CONTRACT";
  if (v === "invoice") return "INVOICE";
  if (v === "technical") return "TECHNICAL";
  if (v === "other") return "OTHER";
  return null;
}

// ---------- PROJECTS ----------
export const ProjectStatusLabel = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
} as const;

export function parseProjectStatus(input: string) {
  const raw = String(input ?? "").trim();
  const up = raw.toUpperCase();
  if (up in ProjectStatusLabel) return up as keyof typeof ProjectStatusLabel;

  const v = raw.toLowerCase();
  if (v === "active") return "ACTIVE";
  if (v === "on hold" || v === "on_hold" || v === "hold") return "ON_HOLD";
  if (v === "completed" || v === "done") return "COMPLETED";
  return null;
}

