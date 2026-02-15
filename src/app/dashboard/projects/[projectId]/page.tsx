// FILE: src/app/dashboard/projects/[projectId]/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ToastProvider";
import { Tabs } from "@/components/Tabs";
import { Modal } from "@/components/Modal";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import FormField from "@/components/ui/FormField/FormField";

import pageStyles from "../projectDetail.module.scss";
import { useServerSession } from "@/lib/useServerSession";

type TabId = "tickets" | "milestones" | "docs";

// ✅ Doc categories used in UI (must match backend parsers)
const DOC_CATEGORIES = ["Contract", "Invoice", "Technical", "Other"] as const;
type DocCategory = (typeof DOC_CATEGORIES)[number];
type DocCategoryFilter = DocCategory | "All";

// Minimal types used in this page
type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  clientEmail: string;
  consultantEmails: string[];
  customer: string;
};

type TicketStatus = "Open" | "In progress" | "In review" | "Blocked" | "Done" | string;
type TicketPriority = "Low" | "Medium" | "High" | "Urgent" | string;

type Ticket = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeEmail: string;
  createdAt: string;
  updatedAt: string;
};

type Milestone = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  progress: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type Doc = {
  id: string;
  projectId: string;
  title: string;
  category: DocCategory | string; // server should return one of DocCategory labels
  tags: string[];
  uploadedAt: string;
};

function normalizeTab(v: string | null): TabId {
  if (v === "tickets" || v === "milestones" || v === "docs") return v;
  return "tickets";
}

// ✅ supports new categories + maps legacy URL values
function normalizeDocCat(v: string | null): DocCategoryFilter {
  if (!v) return "All";

  // legacy support (old UI values)
  if (v === "Design") return "Technical";
  if (v === "Report") return "Other";

  if ((DOC_CATEGORIES as readonly string[]).includes(v)) return v as DocCategory;
  return "All";
}

function normalizeDocCategoryValue(v: string | null | undefined): DocCategory {
  const f = normalizeDocCat(v ?? null);
  return f === "All" ? "Other" : f;
}

function projectTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "success";
  if (s.includes("on hold") || s.includes("hold")) return "warning";
  if (s.includes("completed") || s.includes("done")) return "neutral";
  return "primary";
}

function ticketTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("done")) return "success";
  if (s.includes("blocked")) return "danger";
  if (s.includes("review")) return "warning";
  if (s.includes("progress")) return "primary";
  return "neutral";
}

function milestoneTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("approved")) return "success";
  if (s.includes("ready")) return "warning";
  if (s.includes("overdue")) return "danger";
  if (s.includes("progress")) return "primary";
  return "neutral";
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }
  return data;
}

export default function ProjectDetailPage() {
  // ✅ Hooks ALWAYS run (no early return above these)
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { session, loading: sessionLoading } = useServerSession();

  const role = session?.role ?? "client";
  const canManage = role === "consultant" || role === "admin";
  const canApprove = role === "client" || role === "admin";

  // ---------- DB-backed state ----------
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---------------- URL helper ----------------
  function setUrlParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (!value || value === "All") sp.delete(key);
    else sp.set(key, value);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // ---------------- Tabs (URL synced) ----------------
  const [activeTab, setActiveTab] = useState<TabId>(() => normalizeTab(searchParams?.get("tab")));

  useEffect(() => {
    const t = normalizeTab(searchParams?.get("tab"));
    setActiveTab((prev) => (prev === t ? prev : t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  function changeTab(id: TabId) {
    setActiveTab(id);
    setUrlParam("tab", id);
  }

  // ---------------- Ticket modal state ----------------
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<TicketStatus>("Open");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [assigneeEmail, setAssigneeEmail] = useState("consultant@demo.com");
  const [titleError, setTitleError] = useState<string | undefined>(undefined);

  function openCreateTicket() {
    setEditing(null);
    setTitle("");
    setDesc("");
    setStatus("Open");
    setPriority("Medium");
    setAssigneeEmail("consultant@demo.com");
    setTitleError(undefined);
    setTicketModalOpen(true);
  }

  function openEditTicket(t: Ticket) {
    setEditing(t);
    setTitle(t.title);
    setDesc(t.description);
    setStatus(t.status);
    setPriority(t.priority);
    setAssigneeEmail(t.assigneeEmail);
    setTitleError(undefined);
    setTicketModalOpen(true);
  }

  // ---------------- Documents state (URL synced) ----------------
  const [docSearch, setDocSearch] = useState(() => searchParams?.get("doc_q") ?? "");
  const [docCategoryFilter, setDocCategoryFilter] = useState<DocCategoryFilter>(() =>
    normalizeDocCat(searchParams?.get("doc_cat"))
  );

  useEffect(() => {
    const q = searchParams?.get("doc_q") ?? "";
    const c = normalizeDocCat(searchParams?.get("doc_cat"));

    setDocSearch((prev) => (prev === q ? prev : q));
    setDocCategoryFilter((prev) => (prev === c ? prev : c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const filteredDocs = useMemo(() => {
    const q = docSearch.toLowerCase().trim();

    return docs.filter((d) => {
      const cat = normalizeDocCategoryValue(String(d.category ?? ""));
      if (docCategoryFilter !== "All" && cat !== docCategoryFilter) return false;
      if (!q) return true;

      const inTitle = String(d.title ?? "").toLowerCase().includes(q);
      const inTags = (d.tags ?? []).join(" ").toLowerCase().includes(q);
      return inTitle || inTags;
    });
  }, [docs, docSearch, docCategoryFilter]);

  // Document modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docEditing, setDocEditing] = useState<Doc | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DocCategory>("Contract");
  const [docTags, setDocTags] = useState("");
  const [docTitleError, setDocTitleError] = useState<string | undefined>(undefined);

  function openCreateDoc() {
    setDocEditing(null);
    setDocTitle("");
    setDocCategory("Contract");
    setDocTags("");
    setDocTitleError(undefined);
    setDocModalOpen(true);
  }

  function openEditDoc(d: Doc) {
    setDocEditing(d);
    setDocTitle(d.title);
    setDocCategory(normalizeDocCategoryValue(d.category));
    setDocTags(d.tags.join(", "));
    setDocTitleError(undefined);
    setDocModalOpen(true);
  }

  function parseTags(raw: string) {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  function TagChips({ tags }: { tags: string[] }) {
    if (!tags || tags.length === 0) return <span className={pageStyles.mutedDash}>—</span>;

    const max = 6;
    const shown = tags.slice(0, max);
    const remaining = tags.length - shown.length;

    return (
      <div className={pageStyles.tagWrap}>
        {shown.map((t) => (
          <Badge key={t} tone="neutral">
            {t}
          </Badge>
        ))}
        {remaining > 0 ? <Badge tone="neutral">+{remaining}</Badge> : null}
      </div>
    );
  }

  async function loadAll() {
    if (!projectId) return;

    try {
      setLoading(true);
      setLoadError(null);

      const p = await fetchJson(`/api/projects/${projectId}`);
      const t = await fetchJson(`/api/projects/${projectId}/tickets`);
      const m = await fetchJson(`/api/projects/${projectId}/milestones`);
      const d = await fetchJson(`/api/projects/${projectId}/docs`);

      setProject(p.project);
      setTickets(t.tickets ?? []);
      setMilestones(m.milestones ?? []);
      setDocs(d.docs ?? []);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load project");
      setProject(null);
      setTickets([]);
      setMilestones([]);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only load once session exists (RBAC is server-side now)
    if (!session || !projectId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, session?.role, projectId]);

  async function saveTicket() {
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        setTitleError("Title is required.");
        return;
      }

      if (!projectId) throw new Error("Missing projectId");

      if (editing) {
        await fetchJson(`/api/projects/${projectId}/tickets/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cleanTitle,
            description: desc.trim(),
            status,
            priority,
            assigneeEmail: assigneeEmail.trim(),
          }),
        });
      } else {
        await fetchJson(`/api/projects/${projectId}/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cleanTitle,
            description: desc.trim(),
            status,
            priority,
            assigneeEmail: assigneeEmail.trim(),
          }),
        });
      }

      setTicketModalOpen(false);
      setEditing(null);
      setTitleError(undefined);

      toast.push({
        type: "success",
        title: editing ? "Ticket updated" : "Ticket created",
      });

      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Action blocked", message: e?.message ?? "Error" });
    }
  }

  async function removeTicket(ticketIdToDelete: string) {
    const ok = confirm("Delete this ticket?");
    if (!ok) return;

    try {
      if (!projectId) throw new Error("Missing projectId");

      await fetchJson(`/api/projects/${projectId}/tickets/${ticketIdToDelete}`, { method: "DELETE" });
      toast.push({ type: "success", title: "Ticket deleted" });
      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Delete blocked", message: e?.message ?? "Error" });
    }
  }

  async function consultantMarkReady(milestoneId: string) {
    try {
      if (!projectId) throw new Error("Missing projectId");
      await fetchJson(`/api/projects/${projectId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, status: "Ready for approval" }),
      });
      toast.push({ type: "success", title: "Marked ready for approval" });
      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Blocked", message: e?.message ?? "Error" });
    }
  }

  async function clientApprove(milestoneId: string) {
    try {
      if (!projectId) throw new Error("Missing projectId");
      await fetchJson(`/api/projects/${projectId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, status: "Approved", progress: 100 }),
      });
      toast.push({ type: "success", title: "Milestone approved" });
      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Blocked", message: e?.message ?? "Error" });
    }
  }

  async function saveDoc() {
    try {
      const cleanTitle = docTitle.trim();
      if (!cleanTitle) {
        setDocTitleError("Title is required.");
        return;
      }

      if (!projectId) throw new Error("Missing projectId");

      const tags = parseTags(docTags);

      if (docEditing) {
        await fetchJson(`/api/projects/${projectId}/docs/${docEditing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cleanTitle,
            category: docCategory,
            tags,
          }),
        });
      } else {
        await fetchJson(`/api/projects/${projectId}/docs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cleanTitle,
            category: docCategory,
            tags,
            uploadedAt: new Date().toISOString().slice(0, 10),
          }),
        });
      }

      setDocModalOpen(false);
      setDocEditing(null);
      setDocTitleError(undefined);

      toast.push({
        type: "success",
        title: docEditing ? "Document updated" : "Document added",
      });

      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Action blocked", message: e?.message ?? "Error" });
    }
  }

  async function removeDoc(id: string) {
    const ok = confirm("Delete this document?");
    if (!ok) return;

    try {
      if (!projectId) throw new Error("Missing projectId");
      await fetchJson(`/api/projects/${projectId}/docs/${id}`, { method: "DELETE" });
      toast.push({ type: "success", title: "Document deleted" });
      await loadAll();
    } catch (e: any) {
      toast.push({ type: "error", title: "Delete blocked", message: e?.message ?? "Error" });
    }
  }

  // ✅ Render branches happen AFTER all hooks
  if (sessionLoading) return <div className={pageStyles.page}>Loading session…</div>;
  if (!session) return <div className={pageStyles.page}>Please log in.</div>;
  if (!projectId) return <div className={pageStyles.page}>Loading project…</div>;

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <Card className={pageStyles.cardPad as any}>
          <h1 className={pageStyles.title}>Loading…</h1>
          <div className={pageStyles.notice}>Fetching project from database.</div>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={pageStyles.page}>
        <Card className={pageStyles.cardPad as any}>
          <h1 className={pageStyles.title}>Error</h1>
          <div className={pageStyles.notice}>{loadError}</div>
          <Button size="sm" onClick={() => loadAll()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={pageStyles.page}>
        <Card className={pageStyles.cardPad as any}>
          <h1 className={pageStyles.title}>Project not found / no access</h1>
          <div className={pageStyles.notice}>
            This project may not exist or you are not allowed to see it.
          </div>
          <Link href="/dashboard/projects">← Back to projects</Link>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const openTicketsCount = tickets.filter((t) => String(t.status).toLowerCase() !== "done").length;
  const overdueMilestonesCount = milestones.filter((m) => {
    const isOverdue = m.dueDate < today;
    const notApproved = String(m.status).toLowerCase() !== "approved";
    return isOverdue && notApproved;
  }).length;

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.header}>
        <div className={pageStyles.headerLeft}>
          <div className={pageStyles.breadcrumb}>
            <Link href="/dashboard/projects">Projects</Link> <span>→</span> <span>{project.name}</span>
          </div>

          <div className={pageStyles.titleRow}>
            <h1 className={pageStyles.title}>{project.name}</h1>
            <Badge tone={projectTone(project.status) as any}>{project.status}</Badge>
          </div>

          <div className={pageStyles.subtext}>
            Customer: <strong>{project.customer}</strong> • Last updated: <strong>{project.updatedAt}</strong>
          </div>
        </div>

        <div className={pageStyles.headerActions}>
          <Button size="sm" onClick={() => router.push("/dashboard/projects")}>
            Back
          </Button>
        </div>
      </div>

      <div className={pageStyles.kpiGrid}>
        <Card className={pageStyles.kpi as any}>
          <div className={pageStyles.kpiLabel}>Open tickets</div>
          <div className={pageStyles.kpiValue}>{openTicketsCount}</div>
        </Card>

        <Card className={pageStyles.kpi as any}>
          <div className={pageStyles.kpiLabel}>Overdue milestones</div>
          <div className={pageStyles.kpiValue}>{overdueMilestonesCount}</div>
        </Card>

        <Card className={pageStyles.kpi as any}>
          <div className={pageStyles.kpiLabel}>Documents</div>
          <div className={pageStyles.kpiValue}>{docs.length}</div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "tickets", label: "Tickets" },
          { id: "milestones", label: "Milestones" },
          { id: "docs", label: "Docs" },
        ]}
        activeId={activeTab}
        onChange={(id) => changeTab(id as TabId)}
      />

      {activeTab === "tickets" ? (
        <Card>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Tickets</h2>
            {canManage ? (
              <Button size="sm" onClick={openCreateTicket}>
                + Add ticket
              </Button>
            ) : null}
          </div>

          <div className={pageStyles.tableWrap}>
            <table className={pageStyles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={pageStyles.emptyCell}>
                      No tickets yet.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td className={pageStyles.primaryCell}>
                        <Link
                          href={`/dashboard/tickets/${t.id}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {t.title}
                        </Link>
                      </td>

                      <td>
                        <Badge tone={ticketTone(t.status) as any}>{t.status}</Badge>
                      </td>
                      <td>{t.priority}</td>
                      <td>{t.assigneeEmail}</td>
                      <td>{t.updatedAt}</td>

                      <td className={pageStyles.actionsCell}>
                        <Button size="xs" onClick={() => router.push(`/dashboard/tickets/${t.id}`)}>
                          View
                        </Button>

                        <Button size="xs" onClick={() => openEditTicket(t)} disabled={!canManage}>
                          Edit
                        </Button>

                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => removeTicket(t.id)}
                          disabled={!canManage}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {activeTab === "milestones" ? (
        <Card>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Milestones</h2>
            <div />
          </div>

          <div className={pageStyles.tableWrap}>
            <table className={pageStyles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {milestones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={pageStyles.emptyCell}>
                      No milestones yet.
                    </td>
                  </tr>
                ) : (
                  milestones.map((m) => (
                    <tr key={m.id}>
                      <td className={pageStyles.primaryCell}>{m.title}</td>
                      <td>{m.dueDate}</td>
                      <td>{m.progress}%</td>
                      <td>
                        <Badge tone={milestoneTone(m.status) as any}>{m.status}</Badge>
                      </td>
                      <td className={pageStyles.actionsCell}>
                        {canManage ? (
                          <Button size="xs" onClick={() => consultantMarkReady(m.id)}>
                            Mark ready
                          </Button>
                        ) : null}

                        {canApprove ? (
                          <Button size="xs" variant="primary" onClick={() => clientApprove(m.id)}>
                            Approve
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {activeTab === "docs" ? (
        <Card>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Documents</h2>
            {canManage ? (
              <Button size="sm" onClick={openCreateDoc}>
                + Add document
              </Button>
            ) : null}
          </div>

          <div className={pageStyles.docControls}>
            <input
              className={pageStyles.input as any}
              value={docSearch}
              onChange={(e) => {
                const v = e.target.value;
                setDocSearch(v);
                setUrlParam("doc_q", v.trim() ? v : null);
              }}
              placeholder="Search title or tags..."
            />

            <select
              className={pageStyles.select as any}
              value={docCategoryFilter}
              onChange={(e) => {
                const v = e.target.value as DocCategoryFilter;
                setDocCategoryFilter(v);
                setUrlParam("doc_cat", v === "All" ? null : v);
              }}
            >
              <option value="All">All categories</option>
              <option value="Contract">Contract</option>
              <option value="Invoice">Invoice</option>
              <option value="Technical">Technical</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={pageStyles.tableWrap}>
            <table className={pageStyles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tags</th>
                  <th>Uploaded</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={pageStyles.emptyCell}>
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((d) => (
                    <tr key={d.id}>
                      <td className={pageStyles.primaryCell}>{d.title}</td>
                      <td>{normalizeDocCategoryValue(d.category)}</td>
                      <td>
                        <TagChips tags={d.tags} />
                      </td>
                      <td>{d.uploadedAt}</td>
                      <td className={pageStyles.actionsCell}>
                        <Button size="xs" onClick={() => openEditDoc(d)} disabled={!canManage}>
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => removeDoc(d.id)}
                          disabled={!canManage}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal
        open={ticketModalOpen}
        title={editing ? "Edit ticket" : "Add ticket"}
        onClose={() => setTicketModalOpen(false)}
      >
        <div className={pageStyles.modalForm}>
          <FormField label="Title" error={titleError}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>

          <FormField label="Description">
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
          </FormField>

          <div className={pageStyles.modalGrid}>
            <FormField label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
                <option value="Open">Open</option>
                <option value="In progress">In progress</option>
                <option value="In review">In review</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
            </FormField>

            <FormField label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </FormField>
          </div>

          <FormField label="Assignee email">
            <input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} />
          </FormField>

          <div className={pageStyles.modalActions}>
            <Button onClick={() => setTicketModalOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={saveTicket} variant="primary">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={docModalOpen}
        title={docEditing ? "Edit document" : "Add document"}
        onClose={() => setDocModalOpen(false)}
      >
        <div className={pageStyles.modalForm}>
          <FormField label="Title" error={docTitleError}>
            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
          </FormField>

          <div className={pageStyles.modalGrid}>
            <FormField label="Category">
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as DocCategory)}
              >
                <option value="Contract">Contract</option>
                <option value="Invoice">Invoice</option>
                <option value="Technical">Technical</option>
                <option value="Other">Other</option>
              </select>
            </FormField>

            <FormField label="Tags (comma separated)">
              <input value={docTags} onChange={(e) => setDocTags(e.target.value)} />
            </FormField>
          </div>

          <div className={pageStyles.modalActions}>
            <Button onClick={() => setDocModalOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={saveDoc} variant="primary">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
