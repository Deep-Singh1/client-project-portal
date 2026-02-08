export type ProjectStatus = "Active" | "On hold" | "Completed";

export type Project = {
  id: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  updatedAt: string;
};

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Website Redesign",
    customer: "Acme GmbH",
    status: "Active",
    updatedAt: "2026-02-03",
  },
  {
    id: "p2",
    name: "Client Analytics Setup",
    customer: "Nordlicht AG",
    status: "On hold",
    updatedAt: "2026-01-22",
  },
  {
    id: "p3",
    name: "Mobile App MVP",
    customer: "BlueWhale Ltd",
    status: "Completed",
    updatedAt: "2025-12-15",
  },
];
