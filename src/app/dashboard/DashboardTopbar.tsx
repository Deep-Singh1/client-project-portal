// FILE: src/app/dashboard/DashboardTopbar.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getSession } from "@/lib/auth";
import { useDbVersion } from "@/lib/useDbVersion";
import styles from "./dashboardLayout.module.scss";

export default function DashboardTopbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ rerender on any local db/session change event
  const dbVersion = useDbVersion();

  const session = useMemo(() => getSession(), [dbVersion]);

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
