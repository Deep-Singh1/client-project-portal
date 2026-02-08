// FILE: src/app/dashboard/projects/[projectId]/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { getSession } from "@/lib/auth";
import { useDbVersion } from "@/lib/useDbVersion";

import {
  approveMilestone,
  createTicket,
  deleteTicket,
  getDocs,
  getMilestones,
  getProject,
  getTickets,
  updateMilestone,
  updateTicket,
  createDoc,
  updateDoc,
  deleteDoc,
  type Doc,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/secureStore";

import { Tabs } from "@/components/Tabs";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/ToastProvider";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import FormField from "@/components/ui/FormField/FormField";

import pageStyles from "../projectDetail.module.scss";

type TabId = "tickets" | "milestones" | "docs";

// IMPORTANT: keep DocCategory consistent with store/types.
// store.ts has: type DocCategory = "Contract" | "Design" | "Report"
type DocCategory = "Contract" | "Design" | "Report";
type DocCategoryFilter = DocCategory | "All";

function normalizeTab(v: string | null): TabId {
  if (v === "tickets" || v === "milestones" || v === "docs") return v;
  return "tickets";
}

function normalizeDocCat(v: string | null): DocCategoryFilter {
  if (v === "Contract" || v === "Design" || v === "Report") return v;
  return "All";
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

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const toast = useToast();
  const dbVersion = useDbVersion();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ session should also update on login/logout (dbVersion fires on session changes too)
  const session = useMemo(() => getSession(), [dbVersion]);

  if (!session) return <div className={pageStyles.page}>Please log in.</div>;
  if (!projectId) return <div className={pageStyles.page}>Loading project…</div>;

  // data depends on dbVersion (no tick needed)
  const project = useMemo(() => getProject(session, projectId), [session, projectId, dbVersion]);
  const tickets = useMemo(() => getTickets(session, projectId), [session, projectId, dbVersion]);
  const milestones = useMemo(
    () => getMilestones(session, projectId),
    [session, projectId, dbVersion]
  );
  const docs = useMemo(() => getDocs(session, projectId), [session, projectId, dbVersion]);

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

  const role = session.role;
  const canManage = role === "consultant" || role === "admin";
  const canApprove = role === "client" || role === "admin";

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

  // Only update local state if URL tab actually changed (prevents useless re-renders)
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

  function saveTicket() {
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        setTitleError("Title is required.");
        return;
      }

      if (editing) {
        updateTicket(session, editing.id, {
          title: cleanTitle,
          description: desc.trim(),
          status,
          priority,
          assigneeEmail: assigneeEmail.trim(),
        });
      } else {
        createTicket(session, {
          projectId: project.id,
          title: cleanTitle,
          description: desc.trim(),
          status,
          priority,
          assigneeEmail: assigneeEmail.trim(),
        });
      }

      setTicketModalOpen(false);
      setEditing(null);
      setTitleError(undefined);

      toast.push({
        type: "success",
        title: editing ? "Ticket updated" : "Ticket created",
      });
    } catch (e: any) {
      toast.push({ type: "error", title: "Action blocked", message: e?.message ?? "Error" });
    }
  }

  function removeTicket(ticketId: string) {
    const ok = confirm("Delete this ticket?");
    if (!ok) return;

    try {
      deleteTicket(session, ticketId);
      toast.push({ type: "success", title: "Ticket deleted" });
    } catch (e: any) {
      toast.push({ type: "error", title: "Delete blocked", message: e?.message ?? "Error" });
    }
  }

  // ---------------- Milestones actions ----------------
  function consultantMarkReady(milestoneId: string) {
    try {
      updateMilestone(session, milestoneId, { status: "Ready for approval" as any });
      toast.push({ type: "success", title: "Marked ready for approval" });
    } catch (e: any) {
      toast.push({ type: "error", title: "Blocked", message: e?.message ?? "Error" });
    }
  }

  function clientApprove(milestoneId: string) {
    try {
      approveMilestone(session, milestoneId);
      toast.push({ type: "success", title: "Milestone approved" });
    } catch (e: any) {
      toast.push({ type: "error", title: "Blocked", message: e?.message ?? "Error" });
    }
  }

  // ---------------- Documents state (URL synced) ----------------
  const [docSearch, setDocSearch] = useState(() => searchParams?.get("doc_q") ?? "");
  const [docCategoryFilter, setDocCategoryFilter] = useState<DocCategoryFilter>(() =>
    normalizeDocCat(searchParams?.get("doc_cat"))
  );

  // Keep local doc filters synced if user edits URL directly
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
      if (docCategoryFilter !== "All" && d.category !== docCategoryFilter) return false;
      if (!q) return true;

      const inTitle = d.title.toLowerCase().includes(q);
      const inTags = d.tags.join(" ").toLowerCase().includes(q);
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
    setDocCategory(d.category as DocCategory);
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

  function saveDoc() {
    try {
      const cleanTitle = docTitle.trim();
      if (!cleanTitle) {
        setDocTitleError("Title is required.");
        return;
      }

      const tags = parseTags(docTags);

      if (docEditing) {
        updateDoc(session, docEditing.id, {
          title: cleanTitle,
          category: docCategory,
          tags,
        });
      } else {
        createDoc(session, {
          projectId: project.id,
          title: cleanTitle,
          category: docCategory,
          tags,
        });
      }

      setDocModalOpen(false);
      setDocEditing(null);
      setDocTitleError(undefined);

      toast.push({
        type: "success",
        title: docEditing ? "Document updated" : "Document added",
      });
    } catch (e: any) {
      toast.push({ type: "error", title: "Action blocked", message: e?.message ?? "Error" });
    }
  }

  function removeDoc(id: string) {
    const ok = confirm("Delete this document?");
    if (!ok) return;

    try {
      deleteDoc(session, id);
      toast.push({ type: "success", title: "Document deleted" });
    } catch (e: any) {
      toast.push({ type: "error", title: "Delete blocked", message: e?.message ?? "Error" });
    }
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

  const today = new Date().toISOString().slice(0, 10);
  const openTicketsCount = tickets.filter((t) => String(t.status).toLowerCase() !== "done").length;
  const overdueMilestonesCount = milestones.filter((m) => {
    const isOverdue = m.dueDate < today;
    const notApproved = String(m.status).toLowerCase() !== "approved";
    return isOverdue && notApproved;
  }).length;

  return (
    <div className={pageStyles.page}>
      {/* Header */}
      <div className={pageStyles.header}>
        <div className={pageStyles.headerLeft}>
          <div className={pageStyles.breadcrumb}>
            <Link href="/dashboard/projects">Projects</Link> <span>→</span>{" "}
            <span>{project.name}</span>
          </div>

          <div className={pageStyles.titleRow}>
            <h1 className={pageStyles.title}>{project.name}</h1>
            <Badge tone={projectTone(project.status) as any}>{project.status}</Badge>
          </div>

          <div className={pageStyles.subtext}>
            Customer: <strong>{project.customer}</strong> • Last updated:{" "}
            <strong>{project.updatedAt}</strong>
          </div>
        </div>

        <div className={pageStyles.headerActions}>
          <Button size="sm" onClick={() => router.push("/dashboard/projects")}>
            Back
          </Button>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Tabs */}
      <Card className={pageStyles.cardPad as any}>
        <Tabs
          tabs={[
            { id: "tickets", label: "Tickets" },
            { id: "milestones", label: "Milestones" },
            { id: "docs", label: "Documents" },
          ]}
          activeId={activeTab}
          onChange={(id: any) => changeTab(String(id) as TabId)}
        />

        {/* TICKETS */}
        {activeTab === "tickets" && (
          <div className={pageStyles.panel}>
            <div className={pageStyles.sectionHead}>
              <h2 className={pageStyles.sectionTitle}>Tickets</h2>
              <div className={pageStyles.sectionActions}>
                {canManage ? (
                  <Button size="sm" onClick={openCreateTicket}>
                    + New ticket
                  </Button>
                ) : null}
              </div>
            </div>

            <div className={pageStyles.table}>
              {tickets.length === 0 ? (
                <div className={pageStyles.notice}>No tickets yet.</div>
              ) : (
                tickets.map((t) => (
                  <Card key={t.id} className={pageStyles.cardPad as any}>
                    <div className={pageStyles.row}>
                      <div>
                        <div className={pageStyles.rowTitle}>{t.title}</div>
                        <div className={pageStyles.rowMeta}>{t.assigneeEmail}</div>
                      </div>

                      <div>
                        <Badge tone={ticketTone(t.status) as any}>{t.status}</Badge>
                      </div>

                      <div>
                        <Badge tone="neutral">{t.priority}</Badge>
                      </div>

                      <div className={pageStyles.rowActions}>
                        <Button size="sm" onClick={() => router.push(`/dashboard/tickets/${t.id}`)}>
                          Open
                        </Button>

                        {canManage ? (
                          <>
                            <Button size="sm" onClick={() => openEditTicket(t)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => removeTicket(t.id)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* MILESTONES */}
        {activeTab === "milestones" && (
          <div className={pageStyles.panel}>
            <div className={pageStyles.sectionHead}>
              <h2 className={pageStyles.sectionTitle}>Milestones</h2>
              <div className={pageStyles.sectionActions} />
            </div>

            <div className={pageStyles.table}>
              {milestones.length === 0 ? (
                <div className={pageStyles.notice}>No milestones yet.</div>
              ) : (
                milestones.map((m) => {
                  const isReady = String(m.status).toLowerCase().includes("ready");
                  const isApproved = String(m.status).toLowerCase().includes("approved");

                  return (
                    <Card key={m.id} className={pageStyles.cardPad as any}>
                      <div className={pageStyles.row}>
                        <div>
                          <div className={pageStyles.rowTitle}>{m.title}</div>
                          <div className={pageStyles.rowMeta}>
                            Due: {m.dueDate} • Progress: {m.progress}%
                          </div>
                        </div>

                        <div>
                          <Badge tone={milestoneTone(m.status) as any}>{m.status}</Badge>
                        </div>

                        <div />

                        <div className={pageStyles.rowActions}>
                          {canManage ? (
                            <Button size="sm" onClick={() => consultantMarkReady(m.id)}>
                              Mark ready
                            </Button>
                          ) : null}

                          {canApprove && isReady && !isApproved ? (
                            <Button size="sm" onClick={() => clientApprove(m.id)}>
                              Approve
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "docs" && (
          <div className={pageStyles.panel}>
            <div className={pageStyles.sectionHead}>
              <h2 className={pageStyles.sectionTitle}>Documents</h2>
              <div className={pageStyles.sectionActions}>
                {canManage ? (
                  <Button size="sm" onClick={openCreateDoc}>
                    + Add document
                  </Button>
                ) : null}
              </div>
            </div>

            <div className={pageStyles.table}>
              <Card className={pageStyles.cardPad as any}>
                <div className={pageStyles.docFiltersRow}>
                  <FormField label="Search">
                    <input
                      value={docSearch}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDocSearch(v);
                        setUrlParam("doc_q", v.trim() ? v : null);
                      }}
                      placeholder="Search title or tags..."
                    />
                  </FormField>

                  <FormField label="Category">
                    <select
                      value={docCategoryFilter}
                      onChange={(e) => {
                        const v = normalizeDocCat(e.target.value);
                        setDocCategoryFilter(v);
                        setUrlParam("doc_cat", v === "All" ? null : v);
                      }}
                    >
                      <option value="All">All</option>
                      <option value="Contract">Contract</option>
                      <option value="Design">Design</option>
                      <option value="Report">Report</option>
                    </select>
                  </FormField>

                  <div />
                </div>
              </Card>

              {filteredDocs.length === 0 ? (
                <div className={pageStyles.notice}>No documents found.</div>
              ) : (
                filteredDocs.map((d) => (
                  <Card key={d.id} className={pageStyles.cardPad as any}>
                    <div className={pageStyles.row}>
                      <div>
                        <div className={pageStyles.rowTitle}>{d.title}</div>
                        <div className={pageStyles.rowMeta}>
                          <Badge tone="neutral">{d.category}</Badge>
                        </div>
                      </div>

                      <div>
                        <TagChips tags={d.tags} />
                      </div>

                      <div />

                      <div className={pageStyles.rowActions}>
                        {canManage ? (
                          <>
                            <Button size="sm" onClick={() => openEditDoc(d)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => removeDoc(d.id)}>
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Badge tone="neutral">Read only</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Ticket modal */}
      <Modal
        open={ticketModalOpen}
        title={editing ? "Edit ticket" : "New ticket"}
        onClose={() => setTicketModalOpen(false)}
        footer={
          <>
            <Button size="sm" onClick={() => setTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveTicket}>
              Save
            </Button>
          </>
        }
      >
        <FormField label="Title" error={titleError}>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(undefined);
            }}
          />
        </FormField>

        <FormField label="Description">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
        </FormField>

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

        <FormField label="Assignee email">
          <input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} />
        </FormField>
      </Modal>

      {/* Document modal */}
      <Modal
        open={docModalOpen}
        title={docEditing ? "Edit document" : "Add document"}
        onClose={() => setDocModalOpen(false)}
        footer={
          <>
            <Button size="sm" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveDoc}>
              Save
            </Button>
          </>
        }
      >
        <FormField label="Title" error={docTitleError}>
          <input
            value={docTitle}
            onChange={(e) => {
              setDocTitle(e.target.value);
              if (docTitleError) setDocTitleError(undefined);
            }}
          />
        </FormField>

        <FormField label="Category">
          <select value={docCategory} onChange={(e) => setDocCategory(e.target.value as DocCategory)}>
            <option value="Contract">Contract</option>
            <option value="Design">Design</option>
            <option value="Report">Report</option>
          </select>
        </FormField>

        <FormField label="Tags (comma separated)">
          <input value={docTags} onChange={(e) => setDocTags(e.target.value)} />
        </FormField>
      </Modal>
    </div>
  );
}
