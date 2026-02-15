# Client Project Portal (Next.js + Prisma + Postgres)

![CI](https://github.com/Deep-Singh1/client-project-portal/actions/workflows/ci.yml/badge.svg)

A portfolio SaaS-style portal where **clients, consultants, and admins** can track projects, tickets, milestones, documents, and notifications — with server-side RBAC checks and a DB-backed dashboard.

This repo is designed to be **easy to run locally**, **safe to share publicly** (no secrets in source), and includes **unit + integration tests** plus **CI**.

---

## Features

- **Auth** (cookie-based session)
- **RBAC**: `client`, `consultant`, `admin`
- **Projects**: list + details (visibility enforced server-side)
- **Tickets**: CRUD, status/priority enums, assignee
- **Ticket comments**: add + list comments per ticket
- **Milestones**: progress + approval flow
- **Docs**: categorized documents with tags
- **Notifications**: list + mark read
- **Dashboard**: aggregated per-project counters + notifications
- **OpenAPI**: `/api/openapi` serves the spec and is kept in sync by tests

---

## Tech Stack

- **Next.js (App Router)** + TypeScript
- **Prisma ORM** + **PostgreSQL**
- **Vitest** (unit + integration tests)
- **SCSS modules** + shared tokens
- **GitHub Actions CI** (Postgres service container)

---

## Project Structure

Key paths:

- `src/app/`
  - `src/app/login/` – login page
  - `src/app/dashboard/` – dashboard UI
  - `src/app/dashboard/projects/` – projects UI
  - `src/app/dashboard/tickets/[ticketId]/` – ticket detail + comments UI
- `src/app/api/` (Next.js route handlers)
  - `auth/*`, `dashboard`, `projects/*`, `tickets/*`, `notifications/*`, `health/db`, `openapi`
- `src/lib/`
  - `apiGuards.ts` – auth/RBAC utilities for API routes
  - `requestSchemas.ts` – zod request validation schemas
  - `apiValidation.ts` – validation helpers
  - `enumMaps.ts` – enum labels + parsing helpers
  - `dashboardPayload.ts` – dashboard aggregation helper
  - `openapi.ts` – OpenAPI spec
- `prisma/`
  - `schema.prisma`
  - `migrations/`
  - `seed.mjs` – demo data (idempotent)

---

## Quick Start (Local)

### Requirements
- Node.js **20+**
- A Postgres database (local Postgres, Docker, or hosted like Neon)

### 1) Install dependencies
```bash
npm install
<<<<<<< HEAD
=======


## Screenshots

### Dashboard
![Dashboard]
(public/dashboard.png)

### Projects
![Projects]
(public/projects.png)

### Ticket Detail
![Ticket Detail]
(public/ticket.png)
>>>>>>> de1d9ef (changes  README)
