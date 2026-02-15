import { describe, it, expect } from "vitest";

import {
  Role,
  ProjectStatus,
  TicketStatus,
  TicketPriority,
  MilestoneStatus,
  DocCategory,
} from "@prisma/client";

import {
  TicketStatusLabel,
  TicketPriorityLabel,
  MilestoneStatusLabel,
  DocCategoryLabel,
  ProjectStatusLabel,
  parseTicketStatus,
  parseTicketPriority,
  parseMilestoneStatus,
  parseDocCategory,
  parseProjectStatus,
} from "@/lib/enumMaps";

function sorted(xs: string[]) {
  return [...xs].sort();
}

describe("Prisma enums are in sync with enumMaps", () => {
  it("exports all expected enum types", () => {
    expect(Role.ADMIN).toBe("ADMIN");
    expect(ProjectStatus.ACTIVE).toBe("ACTIVE");
    expect(TicketStatus.OPEN).toBe("OPEN");
    expect(TicketPriority.MEDIUM).toBe("MEDIUM");
    expect(MilestoneStatus.DRAFT).toBe("DRAFT");
    expect(DocCategory.CONTRACT).toBe("CONTRACT");
  });

  it("enumMaps cover every Prisma enum value", () => {
    expect(sorted(Object.values(ProjectStatus))).toEqual(sorted(Object.keys(ProjectStatusLabel)));
    expect(sorted(Object.values(TicketStatus))).toEqual(sorted(Object.keys(TicketStatusLabel)));
    expect(sorted(Object.values(TicketPriority))).toEqual(sorted(Object.keys(TicketPriorityLabel)));
    expect(sorted(Object.values(MilestoneStatus))).toEqual(sorted(Object.keys(MilestoneStatusLabel)));
    expect(sorted(Object.values(DocCategory))).toEqual(sorted(Object.keys(DocCategoryLabel)));
  });

  it("parsers return valid Prisma enum values", () => {
    expect(parseTicketStatus("Open")).toBe(TicketStatus.OPEN);
    expect(parseTicketStatus("in_progress")).toBe(TicketStatus.IN_PROGRESS);
    expect(parseTicketPriority("High")).toBe(TicketPriority.HIGH);
    expect(parseMilestoneStatus("Ready for approval")).toBe(MilestoneStatus.READY_FOR_APPROVAL);
    expect(parseDocCategory("technical")).toBe(DocCategory.TECHNICAL);
    expect(parseProjectStatus("on hold")).toBe(ProjectStatus.ON_HOLD);
  });
});
