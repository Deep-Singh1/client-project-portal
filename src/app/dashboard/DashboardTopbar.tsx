// FILE: src/app/dashboard/DashboardTopbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import styles from "./dashboardLayout.module.scss";
import { getServerSession, type SessionUser } from "@/lib/clientSession";

export default function DashboardTopbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const s = await getServerSession();
      if (!cancelled) setSession(s);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const next = useMemo(() => {
    const p = pathname ?? "/dashboard";
    const qs = searchParams?.toString();
    return qs ? `${p}?${qs}` : p;
  }, [pathname, searchParams]);

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <div className={styles.brand}>Client Project Portal</div>

        <nav className={styles.nav} aria-label="Dashboard navigation">
          <Link className={styles.navLink} href="/dashboard">
            Dashboard
          </Link>
          <Link className={styles.navLink} href="/dashboard/projects">
            Projects
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {session ? (
            <div style={{ fontSize: 12, color: "#666" }}>
              <strong style={{ color: "#111" }}>{session.email}</strong> • {session.role}
            </div>
          ) : null}

          <Link className={styles.navLink} href={`/logout?next=${encodeURIComponent(next)}`}>
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
