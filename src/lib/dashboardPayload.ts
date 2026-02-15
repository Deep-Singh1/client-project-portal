// FILE: src/lib/dashboardPayload.ts
import { ProjectStatusLabel, dateOnlyISO } from "@/lib/enumMaps";

export type DashboardProjectRow = {
  id: string;
  name: string;
  status: keyof typeof ProjectStatusLabel;
  customer: string;
  clientEmail: string;
  consultantEmails: string[];
  updatedAt: Date;
};

export type CountRow = { projectId: string; count: number };

function toCountMap(rows: CountRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.projectId, r.count);
  return map;
}

export function buildDashboardProjects(
  projects: DashboardProjectRow[],
  openTicketCounts: CountRow[],
  overdueMilestoneCounts: CountRow[]
) {
  const tickets = toCountMap(openTicketCounts);
  const milestones = toCountMap(overdueMilestoneCounts);

  const out = projects.map((p) => {
    const openTickets = tickets.get(p.id) ?? 0;
    const overdueMilestones = milestones.get(p.id) ?? 0;

    return {
      id: p.id,
      name: p.name,
      customer: p.customer,
      status: ProjectStatusLabel[p.status],
      updatedAt: dateOnlyISO(p.updatedAt),
      clientEmail: p.clientEmail,
      consultantEmails: p.consultantEmails,
      openTickets,
      overdueMilestones,
    };
  });

  const summary = {
    projects: out.length,
    openTickets: out.reduce((a, p) => a + (p.openTickets ?? 0), 0),
    overdueMilestones: out.reduce((a, p) => a + (p.overdueMilestones ?? 0), 0),
  };

  return { projects: out, summary };
}
