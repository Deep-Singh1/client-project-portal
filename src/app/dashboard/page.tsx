// FILE: src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useServerSession } from "@/lib/useServerSession";

import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import styles from "./dashboardPage.module.scss";

type DashboardProject = {
  id: string;
  name: string;
  customer: string;
  status: string; // API sends label like "Active", "On hold", ...
  updatedAt: string; // date-only string
  clientEmail: string;
  consultantEmails: string[];
  openTickets: number;
  overdueMilestones: number;
};

type ApiNotification = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
  projectId: string | null;
};

type DashboardResponse = {
  ok: boolean;
  summary?: { projects: number; openTickets: number; overdueMilestones: number };
  projects?: DashboardProject[];
  notifications?: ApiNotification[];
  error?: { message?: string };
};

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as DashboardResponse;

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }
  return data;
}

async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "markRead" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }
}

function projectTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "success";
  if (s.includes("on hold") || s.includes("hold")) return "warning";
  if (s.includes("completed") || s.includes("done")) return "neutral";
  return "primary";
}

export default function DashboardPage() {
  const { session, loading: sessionLoading } = useServerSession();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [summary, setSummary] = useState<{
    projects: number;
    openTickets: number;
    overdueMilestones: number;
  } | null>(null);

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const data = await fetchDashboard();
      setProjects(data.projects ?? []);
      setSummary(data.summary ?? null);
      setNotifications(data.notifications ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
      setProjects([]);
      setSummary(null);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, session?.role]);

  if (sessionLoading) {
    return <div className={styles.page}>Loading…</div>;
  }

  // AuthGate should already redirect, but keep a safe fallback
  if (!session) {
    return <div className={styles.page}>Please log in.</div>;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1>Dashboard</h1>
        <div className={styles.subtle}>Backend mode</div>
      </div>

      {loading ? (
        <Card className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Loading…</div>
          <div className={styles.kpiHint}>Fetching your dashboard from database.</div>
        </Card>
      ) : err ? (
        <Card className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Error</div>
          <div className={styles.kpiHint}>{err}</div>
          <div style={{ marginTop: 12 }}>
            <Button size="sm" onClick={() => load()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {!loading && !err && summary ? (
        <div className={styles.grid}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Open tickets</div>
            <div className={styles.kpiValue}>{summary.openTickets}</div>
            <div className={styles.kpiHint}>Across your visible projects</div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Overdue milestones</div>
            <div className={styles.kpiValue}>{summary.overdueMilestones}</div>
            <div className={styles.kpiHint}>Due date passed & not approved</div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Projects</div>
            <div className={styles.kpiValue}>{summary.projects}</div>
            <div className={styles.kpiHint}>Visible for your role</div>
          </Card>
        </div>
      ) : null}

      <div className={styles.split}>
        <Card>
          <h2 className={styles.sectionTitle}>Notifications</h2>

          {notifications.length === 0 ? (
            <div className={styles.empty}>You’re all caught up.</div>
          ) : (
            <div className={styles.notifications}>
              {notifications.slice(0, 8).map((n) => (
                <div key={n.id} className={styles.noticeRow}>
                  <div className={styles.noticeMain}>
                    <div className={styles.noticeTitle}>
                      {!n.read ? <span className={styles.unreadDot} /> : null}
                      Notification
                    </div>

                    <div className={styles.noticeMeta}>
                      {n.message} {n.createdAt ? ` • ${n.createdAt}` : ""}
                    </div>
                  </div>

                  <div className={styles.noticeActions}>
                    {!n.read ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await markNotificationRead(n.id);
                          await load();
                        }}
                      >
                        Mark read
                      </Button>
                    ) : (
                      <Badge tone="neutral">Read</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Quick stats</h2>

          <div className={styles.list}>
            <div className={styles.smallRow}>
              <div className={styles.smallKey}>Role</div>
              <div className={styles.smallVal}>{session.role}</div>
            </div>

            <div className={styles.smallRow}>
              <div className={styles.smallKey}>Visible projects</div>
              <div className={styles.smallVal}>{projects.length}</div>
            </div>

            <div className={styles.smallRow}>
              <div className={styles.smallKey}>Unread notifications</div>
              <div className={styles.smallVal}>{unreadCount}</div>
            </div>

            <div className={styles.smallRow}>
              <div className={styles.smallKey}>Portal status</div>
              <div className={styles.smallVal}>
                <Badge tone="success">Operational</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <h2 className={styles.sectionTitle}>Your projects</h2>

        {projects.length === 0 ? (
          <div className={styles.empty}>No projects visible.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div className={styles.subtle}>
                    {p.customer} • Updated {p.updatedAt}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge tone={projectTone(p.status) as any}>{p.status}</Badge>
                  <Link href={`/dashboard/projects/${p.id}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
