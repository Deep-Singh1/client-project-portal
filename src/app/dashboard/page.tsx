// FILE: src/app/dashboard/page.tsx
"use client";

import { useMemo } from "react";

import { getSession } from "@/lib/auth";
import {
  getNotifications,
  getVisibleProjects,
  getTickets,
  getMilestones,
  markNotificationRead,
} from "@/lib/secureStore";

import { useDbVersion } from "@/lib/useDbVersion";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import styles from "./dashboardPage.module.scss";

export default function DashboardPage() {
  const dbVersion = useDbVersion();

  const session = useMemo(() => getSession(), [dbVersion]);

  if (!session) {
    return <div className={styles.page}>Please log in.</div>;
  }

  const projects = useMemo(() => getVisibleProjects(session), [session, dbVersion]);

  const analytics = useMemo(() => {
    let openTickets = 0;
    let overdueMilestones = 0;

    const today = new Date().toISOString().slice(0, 10);

    for (const p of projects) {
      const tickets = getTickets(session, p.id);
      const milestones = getMilestones(session, p.id);

      openTickets += tickets.filter((t) => String(t.status).toLowerCase() !== "done").length;

      overdueMilestones += milestones.filter((m) => {
        const isOverdue = m.dueDate < today;
        const notApproved = String(m.status).toLowerCase() !== "approved";
        return isOverdue && notApproved;
      }).length;
    }

    return { openTickets, overdueMilestones };
  }, [projects, session, dbVersion]);

  const notifications = useMemo(() => getNotifications(session), [session, dbVersion]);

  function isUnread(n: any) {
    // supports both shapes:
    // - { read: boolean } (store.ts)
    // - { readAt?: string | null } (older shape)
    if (typeof n.read === "boolean") return !n.read;
    return !n.readAt;
  }

  function markRead(id: string) {
    markNotificationRead(session, id);
    // no manual refresh needed — saveDB emits dbUpdated event -> useDbVersion rerenders
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1>Dashboard</h1>
        <div className={styles.subtle}>Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* KPIs */}
      <div className={styles.grid}>
        <Card className={styles.kpiCard as any}>
          <div className={styles.kpiLabel}>Open tickets</div>
          <div className={styles.kpiValue}>{analytics.openTickets}</div>
          <div className={styles.kpiHint}>Across your visible projects</div>
        </Card>

        <Card className={styles.kpiCard as any}>
          <div className={styles.kpiLabel}>Overdue milestones</div>
          <div className={styles.kpiValue}>{analytics.overdueMilestones}</div>
          <div className={styles.kpiHint}>Due date passed & not approved</div>
        </Card>

        <Card className={styles.kpiCard as any}>
          <div className={styles.kpiLabel}>Projects</div>
          <div className={styles.kpiValue}>{projects.length}</div>
          <div className={styles.kpiHint}>Active visibility via role</div>
        </Card>
      </div>

      {/* Split area: Notifications + Quick stats */}
      <div className={styles.split}>
        <Card>
          <h2 className={styles.sectionTitle}>Notifications</h2>

          {notifications.length === 0 ? (
            <div className={styles.empty}>You’re all caught up.</div>
          ) : (
            <div className={styles.notifications}>
              {notifications.slice(0, 8).map((n: any) => (
                <div key={n.id} className={styles.noticeRow}>
                  <div className={styles.noticeMain}>
                    <div className={styles.noticeTitle}>
                      {isUnread(n) ? <span className={styles.unreadDot} /> : null}
                      Notification
                    </div>

                    <div className={styles.noticeMeta}>
                      {n.message ?? ""}
                      {n.createdAt ? ` • ${n.createdAt}` : ""}
                    </div>
                  </div>

                  <div className={styles.noticeActions}>
                    {isUnread(n) ? (
                      <Button size="sm" onClick={() => markRead(n.id)}>
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
              <div className={styles.smallVal}>
                {notifications.filter((x: any) => isUnread(x)).length}
              </div>
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
    </div>
  );
}
