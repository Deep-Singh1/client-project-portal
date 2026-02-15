// FILE: prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function d(dateStr) {
  // expects "YYYY-MM-DD"
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// ---- password hashing (same format as src/lib/password.ts) ----
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function main() {
  const demoPassword = "demo123";

  // 1) USERS (✅ now include passwordHash + update it on every seed)
  const client = await prisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {
      name: "Demo Client",
      role: "CLIENT",
      passwordHash: hashPassword(demoPassword),
    },
    create: {
      email: "client@demo.com",
      name: "Demo Client",
      role: "CLIENT",
      passwordHash: hashPassword(demoPassword),
    },
  });

  const consultant = await prisma.user.upsert({
    where: { email: "consultant@demo.com" },
    update: {
      name: "Demo Consultant",
      role: "CONSULTANT",
      passwordHash: hashPassword(demoPassword),
    },
    create: {
      email: "consultant@demo.com",
      name: "Demo Consultant",
      role: "CONSULTANT",
      passwordHash: hashPassword(demoPassword),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Demo Admin",
      role: "ADMIN",
      passwordHash: hashPassword(demoPassword),
    },
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
      role: "ADMIN",
      passwordHash: hashPassword(demoPassword),
    },
  });

  // 2) PROJECT
  const project = await prisma.project.upsert({
    where: { name: "BASF – Flash Separator Upgrade" },
    update: {
      customer: "BASF",
      status: "ACTIVE",
      clientEmail: client.email,
      consultantEmails: [consultant.email],
      ownerId: admin.id,
    },
    create: {
      name: "BASF – Flash Separator Upgrade",
      customer: "BASF",
      status: "ACTIVE",
      clientEmail: client.email,
      consultantEmails: [consultant.email],
      ownerId: admin.id,
    },
  });

  // 3) TICKET
  const ticket = await prisma.ticket.upsert({
    where: { id: "demo-ticket-1" },
    update: {
      title: "P&ID review: flow direction validation",
      description: "Validate arrows, connectors, and ambiguous edges pipeline.",
      status: "OPEN",
      priority: "MEDIUM",
      assigneeEmail: consultant.email,
      projectId: project.id,
    },
    create: {
      id: "demo-ticket-1",
      projectId: project.id,
      title: "P&ID review: flow direction validation",
      description: "Validate arrows, connectors, and ambiguous edges pipeline.",
      status: "OPEN",
      priority: "MEDIUM",
      assigneeEmail: consultant.email,
    },
  });

    await prisma.ticketComment.createMany({
    data: [
      {
        id: "demo-comment-1",
        ticketId: ticket.id,
        authorEmail: consultant.email,
        body: "I’ll test the edge cases (stroked paths + arrowheads) and report findings.",
      },
      {
        id: "demo-comment-2",
        ticketId: ticket.id,
        authorEmail: client.email,
        body: "Please prioritize items that block drawing approval.",
      },
    ],
    skipDuplicates: true,
  });


   await prisma.milestone.createMany({
    data: [
      {
        id: "demo-ms-1",
        projectId: project.id,
        title: "Prototype validated",
        dueDate: d("2026-02-20"),
        progress: 40,
        status: "DRAFT",
      },
      {
        id: "demo-ms-2",
        projectId: project.id,
        title: "Client approval",
        dueDate: d("2026-03-01"),
        progress: 0,
        status: "READY_FOR_APPROVAL",
      },
    ],
    skipDuplicates: true,
  });


   await prisma.doc.createMany({
    data: [
      {
        id: "demo-doc-1",
        projectId: project.id,
        title: "Contract v1",
        category: "CONTRACT",
        tags: ["signed", "pdf"],
        uploadedAt: d("2026-02-08"),
      },
      {
        id: "demo-doc-2",
        projectId: project.id,
        title: "Technical spec",
        category: "TECHNICAL",
        tags: ["spec", "requirements"],
        uploadedAt: d("2026-02-09"),
      },
    ],
    skipDuplicates: true,
  });


  await prisma.notification.createMany({
    data: [
      {
        id: "demo-notif-1",
        recipientEmail: client.email,
        projectId: project.id,
        type: "info",
        message: "Welcome to backend notifications!",
      },
      {
        id: "demo-notif-2",
        recipientEmail: consultant.email,
        projectId: project.id,
        type: "info",
        message: "New project assigned: BASF – Flash Separator Upgrade",
      },
    ],
    skipDuplicates: true,
  });


  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
