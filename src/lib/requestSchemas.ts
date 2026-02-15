// FILE: src/lib/requestSchemas.ts
import { z } from "zod";
import {
  parseTicketPriority,
  parseTicketStatus,
  parseDocCategory,
  parseMilestoneStatus,
} from "@/lib/enumMaps";

// ---------- shared ----------
const Email = z.string().trim().toLowerCase().email("Invalid email").max(254, "Email too long");

const Title = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title too long (max 120)");

const LongText = z.string().trim().max(5000, "Text too long (max 5000)");

const DateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

// helper: validate label input, transform -> enum key (e.g. "Open" -> "OPEN")
function enumFromParser(parser: (s: string) => string | null, label: string) {
  return z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!parser(v)) ctx.addIssue({ code: "custom", message: `Invalid ${label}` });
    })
    .transform((v) => parser(v)!);
}

// ---------- tickets ----------
const TicketStatusEnum = enumFromParser(parseTicketStatus, "ticket status");
const TicketPriorityEnum = enumFromParser(parseTicketPriority, "ticket priority");

export const TicketCreateSchema = z.object({
  title: Title,
  description: LongText.optional().default(""),
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  assigneeEmail: Email.optional(),
});

export const TicketUpdateSchema = z.object({
  title: Title.optional(),
  description: LongText.optional(),
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  assigneeEmail: Email.optional(),
});

// ---------- docs ----------
const DocCategoryEnum = enumFromParser(parseDocCategory, "doc category");

const Tags = z
  .array(z.string().trim().min(1, "Tag cannot be empty").max(24, "Tag too long (max 24)"))
  .max(12, "Too many tags (max 12)")
  .default([]);

export const DocCreateSchema = z.object({
  title: Title,
  category: DocCategoryEnum.optional(),
  tags: Tags.optional(),
  uploadedAt: DateOnly.optional(),
});

export const DocUpdateSchema = z.object({
  title: Title.optional(),
  category: DocCategoryEnum.optional(),
  tags: Tags.optional(),
  uploadedAt: DateOnly.optional(),
});

// ---------- ticket comments ----------
const CommentBody = z
  .string()
  .trim()
  .min(1, "Comment is required")
  .max(2000, "Comment too long (max 2000)");

// Accept both shapes (legacy message + current body), normalize -> { body }
export const TicketCommentCreateSchema = z
  .object({
    body: CommentBody.optional(),
    message: CommentBody.optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.body && !v.message) {
      ctx.addIssue({ code: "custom", message: "body is required" });
    }
  })
  .transform((v) => ({ body: (v.body ?? v.message)! }));


// ---------- milestones ----------
const MilestoneStatusEnum = enumFromParser(parseMilestoneStatus, "milestone status");

export const MilestonePatchSchema = z.object({
  id: z.string().trim().min(1, "Missing milestone id"),
  title: Title.optional(),
  dueDate: DateOnly.optional(),
  progress: z.number().min(0).max(100).optional(),
  status: MilestoneStatusEnum.optional(),
});

// ---------- notifications ----------
export const NotificationPatchSchema = z.object({
  action: z.literal("markRead"),
});
