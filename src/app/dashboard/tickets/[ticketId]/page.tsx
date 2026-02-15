// FILE: src/app/dashboard/tickets/[ticketId]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useServerSession } from "@/lib/useServerSession";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import FormField from "@/components/ui/FormField/FormField";

import styles from "../ticketDetail.module.scss";

type Ticket = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeEmail: string;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
};

type Comment = {
  id: string;
  ticketId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok)
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  return data;
}

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params?.ticketId;

  const { session, loading: sessionLoading } = useServerSession();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const canEditTicket = useMemo(() => {
    if (!session) return false;
    return session.role === "admin" || session.role === "consultant";
  }, [session]);

  function statusTone(s: string) {
    const v = String(s).toLowerCase();
    if (v.includes("done")) return "success";
    if (v.includes("blocked")) return "danger";
    if (v.includes("progress")) return "warning";
    if (v.includes("review")) return "warning";
    return "neutral";
  }

  function priorityTone(p: string) {
    const v = String(p).toLowerCase();
    if (v.includes("urgent")) return "danger";
    if (v.includes("high")) return "warning";
    return "neutral";
  }

  async function loadAll(currentTicketId: string) {
    try {
      setLoading(true);
      setErr(null);

      const t = await fetchJson(`/api/tickets/${currentTicketId}`);
      setTicket(t.ticket);

      const p = await fetchJson(`/api/projects/${t.ticket.projectId}`);
      setProject({ id: p.project.id, name: p.project.name });

      const c = await fetchJson(`/api/tickets/${currentTicketId}/comments`);

      // Support both shapes (body or message) safely
      const mapped: Comment[] = (c.comments ?? []).map((x: any) => ({
        id: x.id,
        ticketId: x.ticketId,
        authorEmail: x.authorEmail,
        body: String(x.body ?? x.message ?? ""),
        createdAt: x.createdAt,
      }));

      setComments(mapped);
    } catch (e: any) {
      setErr(e?.message || "Failed to load ticket");
      setTicket(null);
      setProject(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) return;
    if (!ticketId) return;
    loadAll(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session?.email, session?.role, ticketId]);

  async function submitComment() {
    const body = newComment.trim();
    if (!body) return;
    if (!ticketId) return;

    try {
      await fetchJson(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      setNewComment("");
      await loadAll(ticketId);
    } catch (e: any) {
      setErr(e?.message || "Failed to post comment");
    }
  }

  async function updateTicket(patch: Partial<Pick<Ticket, "status" | "priority">>) {
    if (!ticketId) return;
    if (!canEditTicket) return;

    // Optimistic UI
    setTicket((prev) => (prev ? { ...prev, ...patch } : prev));

    try {
      await fetchJson(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      await loadAll(ticketId);
    } catch (e: any) {
      setErr(e?.message || "Failed to update ticket");
      // Reload to revert optimistic update if needed
      await loadAll(ticketId);
    }
  }

  if (sessionLoading) return <div className={styles.page}>Loading session…</div>;
  if (!session) return <div className={styles.page}>Please log in.</div>;
  if (!ticketId) return <div className={styles.page}>Loading ticket…</div>;

  if (loading) return <div className={styles.page}>Loading…</div>;
  if (err) return <div className={styles.page}>Error: {err}</div>;

  if (!ticket || !project) {
    return (
      <div className={styles.page}>
        <Card className={styles.headerCard as any}>
          <h1>Ticket not found / no access</h1>
          <Link href="/dashboard/projects">← Back to projects</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbRow}>
        <Link href={`/dashboard/projects/${project.id}`}>← Back to project</Link>
        <span>•</span>
        <span>Project: {project.name}</span>
      </div>

      <Card className={styles.headerCard as any}>
        <div className={styles.headerTop}>
          <div className={styles.titleBlock}>
            <h1>{ticket.title}</h1>
            {ticket.description ? (
              <div className={styles.desc}>{ticket.description}</div>
            ) : null}
          </div>

          <div className={styles.chips}>
            <Badge tone={statusTone(ticket.status) as any}>{ticket.status}</Badge>
            <Badge tone={priorityTone(ticket.priority) as any}>
              {ticket.priority}
            </Badge>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div>Assignee: {ticket.assigneeEmail}</div>
          <div>Updated: {ticket.updatedAt}</div>
        </div>
      </Card>

      <div className={styles.layout}>
        <Card className={styles.commentsCard as any}>
          <h2 className={styles.commentsTitle}>Comments</h2>

          <div className={styles.commentList}>
            {comments.length === 0 ? (
              <div className={styles.empty}>No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentAuthor}>{c.authorEmail}</div>
                  <div className={styles.commentBody}>{c.body}</div>
                  <div className={styles.commentMeta}>{c.createdAt}</div>
                </div>
              ))
            )}
          </div>

          <div className={styles.commentForm}>
            <FormField
              label="Add a comment"
              hint="Append-only. Comments can’t be edited or deleted."
            >
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Type your message..."
              />
            </FormField>

            <div className={styles.commentCtaRow}>
              <Button variant="primary" onClick={submitComment}>
                Post Comment
              </Button>
            </div>
          </div>
        </Card>

        <Card className={styles.panel as any}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelTitle}>Ticket controls</h2>
            <span className={styles.readOnly}>
              {canEditTicket ? "Editable" : "Read-only"}
            </span>
          </div>

          <div className={styles.formGrid}>
            <div>
              <FormField
                label="Status"
                hint={canEditTicket ? "Update ticket status." : "Read-only for your role."}
              >
                <select
                  className={styles.select}
                  value={ticket.status}
                  disabled={!canEditTicket}
                  onChange={(e) => updateTicket({ status: e.target.value })}
                >
                  <option value="Open">Open</option>
                  <option value="In progress">In progress</option>
                  <option value="In review">In review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField
                label="Priority"
                hint={canEditTicket ? "Update ticket priority." : "Read-only for your role."}
              >
                <select
                  className={styles.select}
                  value={ticket.priority}
                  disabled={!canEditTicket}
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </FormField>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
