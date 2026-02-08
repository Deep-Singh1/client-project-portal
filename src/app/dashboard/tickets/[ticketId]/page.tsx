// FILE: src/app/dashboard/tickets/[ticketId]/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { getSession } from "@/lib/auth";
import { useDbVersion } from "@/lib/useDbVersion";

import {
  addTicketComment,
  getProject,
  getTicket,
  getTicketComments,
  updateTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/secureStore";

import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import FormField from "@/components/ui/FormField/FormField";

import styles from "../ticketDetail.module.scss";

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params?.ticketId;

  // Triggers re-render whenever the local DB changes
  const dbVersion = useDbVersion();

  const session = useMemo(() => getSession(), []);

  if (!session) {
    return <div className={styles.page}>Please log in.</div>;
  }

  if (!ticketId) return <div className={styles.page}>Loading ticket…</div>;

  const ticket = useMemo(
    () => getTicket(session, ticketId),
    [session, ticketId, dbVersion]
  );

  if (!ticket) {
    return (
      <div className={styles.page}>
        <Card className={styles.headerCard as any}>
          <h1>Ticket not found / no access</h1>
          <Link href="/dashboard/projects">← Back to projects</Link>
        </Card>
      </div>
    );
  }

  const project = useMemo(
    () => getProject(session, ticket.projectId),
    [session, ticket.projectId, dbVersion]
  );

  if (!project) {
    return (
      <div className={styles.page}>
        <Card className={styles.headerCard as any}>
          <h1>Project not found / no access</h1>
          <Link href="/dashboard/projects">← Back to projects</Link>
        </Card>
      </div>
    );
  }

  const comments = useMemo(
    () => getTicketComments(session, ticket.id),
    [session, ticket.id, dbVersion]
  );

  const role = session.role;
  const canEdit = role === "consultant" || role === "admin";

  const [newComment, setNewComment] = useState("");

  function statusTone(s: string) {
    const v = s.toLowerCase();
    if (v.includes("done")) return "success";
    if (v.includes("blocked")) return "danger";
    if (v.includes("progress")) return "warning";
    if (v.includes("review")) return "warning";
    return "neutral";
  }

  function priorityTone(p: string) {
    const v = p.toLowerCase();
    if (v.includes("urgent")) return "danger";
    if (v.includes("high")) return "warning";
    return "neutral";
  }

  function changeStatus(v: TicketStatus) {
    if (!canEdit) return;
    updateTicket(session, ticket.id, { status: v });
    // no refresh needed: store emits dbUpdated -> useDbVersion rerenders
  }

  function changePriority(v: TicketPriority) {
    if (!canEdit) return;
    updateTicket(session, ticket.id, { priority: v });
  }

  function submitComment() {
    const body = newComment.trim();
    if (!body) return;

    addTicketComment(session, ticket.id, body);
    setNewComment("");
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbRow}>
        <Link href={`/dashboard/projects/${project.id}`}>← Back to project</Link>
        <span>•</span>
        <span>Project: {project.name}</span>
      </div>

      {/* Ticket summary */}
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
            <Badge tone={priorityTone(ticket.priority) as any}>{ticket.priority}</Badge>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div>Assignee: {ticket.assigneeEmail}</div>
          <div>Updated: {ticket.updatedAt}</div>
        </div>
      </Card>

      {/* Main layout: comments + side panel */}
      <div className={styles.layout}>
        {/* Comments */}
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
            <FormField label="Add a comment" hint="Be clear and short.">
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

        {/* Controls panel */}
        <Card className={styles.panel as any}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelTitle}>Ticket controls</h2>
            {!canEdit ? <span className={styles.readOnly}>Read-only</span> : null}
          </div>

          <div className={styles.formGrid}>
            <div>
              <FormField
                label="Status"
                hint={!canEdit ? "Only consultant/admin can change status." : undefined}
              >
                <select
                  className={styles.select}
                  value={ticket.status}
                  disabled={!canEdit}
                  onChange={(e) => changeStatus(e.target.value as TicketStatus)}
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
              <FormField label="Priority">
                <select
                  className={styles.select}
                  value={ticket.priority}
                  disabled={!canEdit}
                  onChange={(e) => changePriority(e.target.value as TicketPriority)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Removed manual refresh button (not needed anymore) */}
        </Card>
      </div>
    </div>
  );
}
