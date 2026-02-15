import { describe, it, expect } from "vitest";
import { buildDashboardProjects } from "@/lib/dashboardPayload";

describe("buildDashboardProjects", () => {
  it("merges per-project counts + produces correct summary", () => {
    const projects = [
      {
        id: "p1",
        name: "Alpha",
        status: "ACTIVE" as const,
        customer: "BASF",
        clientEmail: "client@demo.com",
        consultantEmails: ["consultant@demo.com"],
        updatedAt: new Date("2026-02-10T00:00:00.000Z"),
      },
      {
        id: "p2",
        name: "Beta",
        status: "ON_HOLD" as const,
        customer: "ACME",
        clientEmail: "client2@demo.com",
        consultantEmails: [],
        updatedAt: new Date("2026-02-11T00:00:00.000Z"),
      },
    ];

    const openTicketCounts = [{ projectId: "p1", count: 3 }];
    const overdueMilestoneCounts = [{ projectId: "p2", count: 2 }];

    const out = buildDashboardProjects(projects as any, openTicketCounts, overdueMilestoneCounts);

    expect(out.summary).toEqual({ projects: 2, openTickets: 3, overdueMilestones: 2 });

    expect(out.projects[0].openTickets).toBe(3);
    expect(out.projects[0].overdueMilestones).toBe(0);
    expect(out.projects[1].openTickets).toBe(0);
    expect(out.projects[1].overdueMilestones).toBe(2);
  });
});
