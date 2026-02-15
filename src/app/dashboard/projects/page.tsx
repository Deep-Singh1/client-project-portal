// FILE: src/app/dashboard/projects/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";

import { useServerSession } from "@/lib/useServerSession";

// ✅ correct existing stylesheet
import styles from "./projectsPage.module.scss";

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  clientEmail: string;
  consultantEmails: string[];
  customer: string;
};

function tone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "success";
  if (s.includes("hold")) return "warning";
  if (s.includes("completed") || s.includes("done")) return "neutral";
  return "primary";
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  return data;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useServerSession();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ ALWAYS call useMemo (no early returns above it)
  const visibleProjects = useMemo(() => {
    if (!session) return [];

    if (session.role === "admin") return projects;

    if (session.role === "consultant") {
      return projects.filter((p) => p.consultantEmails?.includes(session.email));
    }

    return projects.filter((p) => p.clientEmail === session.email);
  }, [projects, session]);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.replace("/login?next=/dashboard/projects");
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const data = await fetchJson("/api/projects");
        const list: Project[] = data.projects ?? [];
        setProjects(list);
      } catch (e: any) {
        setErr(e?.message || "Failed to load projects");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionLoading, session, router]);

  // ✅ Now it’s safe to do conditional UI returns
  if (sessionLoading) {
    return (
      <div className={styles.page}>
        <Card className={styles.cardPad as any}>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.muted}>Loading session…</p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.page}>
        <Card className={styles.cardPad as any}>
          <h1 className={styles.title}>Redirecting…</h1>
          <p className={styles.muted}>Sending you to login.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.muted}>
            Signed in as <strong>{session.email}</strong> (<strong>{session.role}</strong>)
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button size="sm" onClick={() => router.push("/logout?next=/dashboard/projects")}>
            Logout
          </Button>
        </div>
      </div>

      <Card className={styles.cardPad as any}>
        {loading ? (
          <p className={styles.muted}>Loading projects…</p>
        ) : err ? (
          <div className={styles.errorBox}>
            <p className={styles.errorTitle}>Failed to load</p>
            <p className={styles.muted}>{err}</p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <p className={styles.muted}>No visible projects.</p>
        ) : (
          <div className={styles.grid}>
            {visibleProjects.map((p) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={styles.projectLink}>
                <Card className={styles.projectCard as any}>
                  <div className={styles.projectTop}>
                    <div className={styles.projectName}>{p.name}</div>
                    <Badge tone={tone(p.status) as any}>{p.status}</Badge>
                  </div>

                  <div className={styles.projectMeta}>
                    <div>
                      <span className={styles.metaLabel}>Customer</span>
                      <span className={styles.metaValue}>{p.customer}</span>
                    </div>

                    <div>
                      <span className={styles.metaLabel}>Updated</span>
                      <span className={styles.metaValue}>{p.updatedAt}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
