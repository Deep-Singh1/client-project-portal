// FILE: tests/integration/smoke.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { prisma } from "@/lib/prisma";

// Route handlers (direct imports)
import { GET as HealthGET } from "@/app/api/health/db/route";
import { POST as LoginPOST } from "@/app/api/auth/login/route";
import { GET as SessionGET } from "@/app/api/auth/session/route";
import { GET as DashboardGET } from "@/app/api/dashboard/route";
import {
  GET as CommentsGET,
  POST as CommentsPOST,
} from "@/app/api/tickets/[ticketId]/comments/route";
import { PATCH as NotificationPATCH } from "@/app/api/notifications/[notificationId]/route";

function setCookieHeader(cookieHeader: string) {
  (globalThis as any).__TEST_COOKIE_HEADER__ = cookieHeader;
}

function extractCookieFromSetCookie(setCookie: string, name: string) {
  // "cpp_session=VALUE; Path=/; HttpOnly; SameSite=Lax"
  const first = setCookie.split(";")[0]?.trim();
  if (!first) return null;
  const [k, ...rest] = first.split("=");
  if (k !== name) return null;
  return `${name}=${rest.join("=")}`;
}

const hasDb = !!process.env.DATABASE_URL;
const describeDb = hasDb ? describe : describe.skip;

describeDb("API integration smoke (real route handlers + DB)", () => {
  let createdNotificationId: string | null = null;

  beforeAll(async () => {
    // Ensure seed exists (login needs seeded users + passwordHash)
    const user = await prisma.user.findUnique({
      where: { email: "consultant@demo.com" },
      select: { email: true, passwordHash: true },
    });

    if (!user) {
      throw new Error(
        "Seed missing: consultant@demo.com not found. Run: npm run db:migrate && npm run db:seed"
      );
    }
    if (!user.passwordHash) {
      throw new Error(
        "Seed incomplete: passwordHash empty. Run: npm run db:seed"
      );
    }

    // Create a notification just for this test (we will delete it later)
    const n = await prisma.notification.create({
      data: {
        recipientEmail: "consultant@demo.com",
        type: "info",
        message: `integration test notification ${Date.now()}`,
      },
      select: { id: true },
    });
    createdNotificationId = n.id;

    // Login and store cookie for subsequent authenticated routes
    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "consultant@demo.com", password: "demo123" }),
    });

    const loginRes = await LoginPOST(loginReq);
    expect(loginRes.status).toBe(200);

    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    const cookieHeader = extractCookieFromSetCookie(setCookie!, "cpp_session");
    expect(cookieHeader).toBeTruthy();

    setCookieHeader(cookieHeader!);
  });

  afterAll(async () => {
    // cleanup notification created by tests
    if (createdNotificationId) {
      await prisma.notification.delete({ where: { id: createdNotificationId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("GET /api/health/db returns ok", async () => {
    const res = await HealthGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("Auth flow: /api/auth/session returns the logged-in session", async () => {
    const res = await SessionGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.session?.email).toBe("consultant@demo.com");
    expect(body.session?.role).toBe("consultant");
  });

  it("GET /api/dashboard returns summary + projects + notifications (authenticated)", async () => {
    const res = await DashboardGET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.summary).toBeTruthy();
    expect(typeof body.summary.projects).toBe("number");
    expect(typeof body.summary.openTickets).toBe("number");
    expect(typeof body.summary.overdueMilestones).toBe("number");

    expect(Array.isArray(body.projects)).toBe(true);
    expect(Array.isArray(body.notifications)).toBe(true);
  });

  it("Ticket comments: POST then GET returns the new comment (and cleans up)", async () => {
    // Ensure demo ticket exists
    const t = await prisma.ticket.findUnique({
      where: { id: "demo-ticket-1" },
      select: { id: true },
    });
    if (!t) {
      throw new Error("demo-ticket-1 missing. Run: npm run db:seed");
    }

    // Create comment via API
    const postReq = new Request("http://localhost/api/tickets/demo-ticket-1/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: `integration comment ${Date.now()}` }),
    });

    const postRes = await CommentsPOST(postReq, {
      params: Promise.resolve({ ticketId: "demo-ticket-1" }),
    });
    expect(postRes.status).toBe(200);

    const postBody = await postRes.json();
    expect(postBody.ok).toBe(true);
    expect(postBody.comment?.id).toBeTruthy();

    const createdCommentId = postBody.comment.id as string;

    // GET comments and confirm it exists
    const getRes = await CommentsGET(new Request("http://localhost/api/tickets/demo-ticket-1/comments"), {
      params: Promise.resolve({ ticketId: "demo-ticket-1" }),
    });
    expect(getRes.status).toBe(200);

    const getBody = await getRes.json();
    expect(getBody.ok).toBe(true);
    expect(Array.isArray(getBody.comments)).toBe(true);

    const found = getBody.comments.some((c: any) => c.id === createdCommentId);
    expect(found).toBe(true);

    // cleanup (delete created comment)
    await prisma.ticketComment.delete({ where: { id: createdCommentId } });
  });

  it("Notifications: PATCH markRead works on owned notification", async () => {
    expect(createdNotificationId).toBeTruthy();

    const req = new Request(`http://localhost/api/notifications/${createdNotificationId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "markRead" }),
    });

    const res = await NotificationPATCH(req, {
      params: Promise.resolve({ notificationId: createdNotificationId! }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.notification?.id).toBe(createdNotificationId);
    expect(body.notification?.readAt).toBeTruthy();
  });

  it("Dashboard returns 401 if no cookie (auth guard works)", async () => {
    const old = (globalThis as any).__TEST_COOKIE_HEADER__;
    setCookieHeader("");

    const res = await DashboardGET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);

    setCookieHeader(old);
  });
});
