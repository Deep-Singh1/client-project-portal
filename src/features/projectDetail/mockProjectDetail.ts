export type TicketStatus = "Open" | "In progress" | "Done" | "Blocked";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type Ticket = {
  id: string;
  projectId: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  progress: number; // 0..100
  status: "Planned" | "In progress" | "Ready for approval" | "Approved";
};

export type Doc = {
  id: string;
  projectId: string;
  title: string;
  category: "Contract" | "Design" | "Report";
  tags: string[];
  uploadedAt: string;
};

export const TICKETS: Ticket[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "Create new homepage layout",
    status: "In progress",
    priority: "High",
    assignee: "Consultant",
  },
  {
    id: "t2",
    projectId: "p1",
    title: "Fix mobile menu bugs",
    status: "Open",
    priority: "Medium",
    assignee: "Consultant",
  },
  {
    id: "t3",
    projectId: "p2",
    title: "Define tracking events list",
    status: "Blocked",
    priority: "Urgent",
    assignee: "Client",
  },
];

export const MILESTONES: Milestone[] = [
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

export const DOCS: Doc[] = [
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
