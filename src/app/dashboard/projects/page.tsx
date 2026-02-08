// FILE: src/app/dashboard/projects/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getVisibleProjects, type ProjectStatus } from "@/lib/secureStore";
import { useDbVersion } from "@/lib/useDbVersion";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import styles from "./projectsPage.module.scss";

type SortKey = "name" | "customer" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

function normalizeSortKey(v: string | null): SortKey {
  if (v === "name" || v === "customer" || v === "status" || v === "updatedAt") return v;
  return "updatedAt";
}
function normalizeSortDir(v: string | null): SortDir {
  if (v === "asc" || v === "desc") return v;
  return "desc";
}
function normalizeStatus(v: string | null): ProjectStatus | "All" {
  if (v === "Active" || v === "On hold" || v === "Completed") return v;
  return "All";
}
function normalizePage(v: string | null): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dbVersion = useDbVersion();
  const session = useMemo(() => getSession(), [dbVersion]);

  if (!session) {
    return <div className={styles.page}>Please log in.</div>;
  }

  // ---------- URL -> initial state ----------
  const initialQ = searchParams?.get("q") ?? "";
  const initialStatus = normalizeStatus(searchParams?.get("status"));
  const initialSortKey = normalizeSortKey(searchParams?.get("sort"));
  const initialSortDir = normalizeSortDir(searchParams?.get("dir"));
  const initialPage = normalizePage(searchParams?.get("page"));

  // We keep two searches:
  // - searchInput: immediate typing
  // - searchApplied: debounced value used for filtering + URL
  const [searchInput, setSearchInput] = useState(initialQ);
  const [searchApplied, setSearchApplied] = useState(initialQ);

  const [status, setStatus] = useState<ProjectStatus | "All">(initialStatus);
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);
  const [page, setPage] = useState(initialPage);
  const pageSize = 5;

  // ---------- Helper: set URL params ----------
  function setUrlParams(patch: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // ---------- Keep state synced if user pastes/edits URL ----------
  useEffect(() => {
    const q = searchParams?.get("q") ?? "";
    const st = normalizeStatus(searchParams?.get("status"));
    const sk = normalizeSortKey(searchParams?.get("sort"));
    const sd = normalizeSortDir(searchParams?.get("dir"));
    const pg = normalizePage(searchParams?.get("page"));

    setSearchInput(q);
    setSearchApplied(q);
    setStatus(st);
    setSortKey(sk);
    setSortDir(sd);
    setPage(pg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  // ---------- Debounce search input -> applied + URL ----------
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const clean = searchInput.trim();
      setSearchApplied(clean);
      // when search changes, go to page 1
      setPage(1);
      setUrlParams({
        q: clean ? clean : null,
        page: "1",
      });
    }, 300);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ---------- Data ----------
  const allProjects = useMemo(() => getVisibleProjects(session), [session, dbVersion]);

  const filtered = useMemo(() => {
    const s = searchApplied.toLowerCase().trim();

    let out = allProjects;

    if (status !== "All") {
      out = out.filter((p) => p.status === status);
    }

    if (s) {
      out = out.filter(
        (p) => p.name.toLowerCase().includes(s) || p.customer.toLowerCase().includes(s)
      );
    }

    out = [...out].sort((a, b) => {
      const av = String(a[sortKey]).toLowerCase();
      const bv = String(b[sortKey]).toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return out;
  }, [allProjects, searchApplied, status, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  // If filters reduce pageCount, clamp page and update URL
  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
      setUrlParams({ page: String(safePage) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, page, pageCount]);

  function statusTone(st: string) {
    if (st === "Active") return "success";
    if (st === "On hold") return "warning";
    return "default";
  }

  function clearAll() {
    setSearchInput("");
    setSearchApplied("");
    setStatus("All");
    setSortKey("updatedAt");
    setSortDir("desc");
    setPage(1);
    setUrlParams({
      q: null,
      status: null,
      sort: null,
      dir: null,
      page: null,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1>Projects</h1>
        <div className={styles.subtle}>
          Showing {items.length} of {filtered.length}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <input
          className={styles.input}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by project or customer..."
        />

        <select
          className={styles.select}
          value={status}
          onChange={(e) => {
            const v = e.target.value as any;
            setStatus(v);
            setPage(1);
            setUrlParams({
              status: v === "All" ? null : String(v),
              page: "1",
            });
          }}
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="On hold">On hold</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          className={styles.select}
          value={sortKey}
          onChange={(e) => {
            const v = e.target.value as SortKey;
            setSortKey(v);
            setPage(1);
            setUrlParams({
              sort: v,
              page: "1",
            });
          }}
        >
          <option value="updatedAt">Sort: Updated</option>
          <option value="name">Sort: Name</option>
          <option value="customer">Sort: Customer</option>
          <option value="status">Sort: Status</option>
        </select>

        <Button
          size="sm"
          onClick={() => {
            const next = sortDir === "asc" ? "desc" : "asc";
            setSortDir(next);
            setPage(1);
            setUrlParams({
              dir: next,
              page: "1",
            });
          }}
        >
          {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
        </Button>

        <Button size="sm" onClick={clearAll}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <Card className={styles.tableCard as any}>
        <div className={styles.tableWrap}>
          <div className={`${styles.grid} ${styles.headerRow}`}>
            <div>Project</div>
            <div>Customer</div>
            <div>Status</div>
            <div>Updated</div>
          </div>

          <div className={styles.divider} />

          {items.length === 0 ? (
            <div className={styles.empty}>No projects found. Try clearing filters.</div>
          ) : (
            items.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className={`${styles.grid} ${styles.rowLink}`}
              >
                <div className={styles.projectName}>{p.name}</div>
                <div>{p.customer}</div>

                <div>
                  <Badge tone={statusTone(p.status) as any}>{p.status}</Badge>
                </div>

                <div className={styles.muted}>{p.updatedAt}</div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      <div className={styles.pagination}>
        <Button
          size="sm"
          disabled={safePage <= 1}
          onClick={() => {
            const next = Math.max(1, safePage - 1);
            setPage(next);
            setUrlParams({ page: String(next) });
          }}
        >
          Prev
        </Button>

        <div className={styles.pageInfo}>
          Page {safePage} / {pageCount}
        </div>

        <Button
          size="sm"
          disabled={safePage >= pageCount}
          onClick={() => {
            const next = Math.min(pageCount, safePage + 1);
            setPage(next);
            setUrlParams({ page: String(next) });
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
