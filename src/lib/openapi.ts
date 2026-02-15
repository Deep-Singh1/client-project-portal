// FILE: src/lib/openapi.ts

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Client Project Portal API",
    version: "1.0.0",
    description:
      "API for the Client Project Portal (Next.js App Router + Prisma/Postgres). Uses httpOnly cookie session: cpp_session.",
  },
  servers: [{ url: "/" }],

  tags: [
    { name: "OpenAPI" },
    { name: "Auth" },
    { name: "Health" },
    { name: "Dashboard" },
    { name: "Projects" },
    { name: "Tickets" },
    { name: "Docs" },
    { name: "Milestones" },
    { name: "Comments" },
    { name: "Notifications" },
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "cpp_session",
        description: "Session cookie set by POST /api/auth/login",
      },
    },

    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["ok", "error"],
        properties: {
          ok: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string" },
              details: {
                type: "array",
                description: "Zod-style validation issues (optional)",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },

      Session: {
        type: "object",
        required: ["email", "role"],
        properties: {
          email: { type: "string", example: "consultant@demo.com" },
          role: { type: "string", enum: ["client", "consultant", "admin"] },
        },
      },

      Project: {
        type: "object",
        required: [
          "id",
          "name",
          "status",
          "customer",
          "clientEmail",
          "consultantEmails",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["Active", "On hold", "Completed"] },
          customer: { type: "string" },
          clientEmail: { type: "string" },
          consultantEmails: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", example: "2026-02-09" },
          updatedAt: { type: "string", example: "2026-02-09" },
        },
      },

      DashboardSummary: {
        type: "object",
        required: ["projects", "openTickets", "overdueMilestones"],
        properties: {
          projects: { type: "integer", minimum: 0 },
          openTickets: { type: "integer", minimum: 0 },
          overdueMilestones: { type: "integer", minimum: 0 },
        },
      },

      DashboardProject: {
        type: "object",
        required: [
          "id",
          "name",
          "customer",
          "status",
          "updatedAt",
          "clientEmail",
          "consultantEmails",
          "openTickets",
          "overdueMilestones",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          customer: { type: "string" },
          status: { type: "string", enum: ["Active", "On hold", "Completed"] },
          updatedAt: { type: "string", example: "2026-02-09" },
          clientEmail: { type: "string" },
          consultantEmails: { type: "array", items: { type: "string" } },
          openTickets: { type: "integer", minimum: 0 },
          overdueMilestones: { type: "integer", minimum: 0 },
        },
      },

      Ticket: {
        type: "object",
        required: [
          "id",
          "projectId",
          "title",
          "description",
          "status",
          "priority",
          "assigneeEmail",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["Open", "In progress", "In review", "Blocked", "Done"],
          },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
          assigneeEmail: { type: ["string", "null"] },
          createdAt: { type: "string", example: "2026-02-09" },
          updatedAt: { type: "string", example: "2026-02-09" },
        },
      },

      TicketWithProject: {
        allOf: [
          { $ref: "#/components/schemas/Ticket" },
          {
            type: "object",
            required: ["project"],
            properties: {
              project: {
                type: "object",
                required: ["clientEmail", "consultantEmails"],
                properties: {
                  clientEmail: { type: "string" },
                  consultantEmails: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        ],
      },

      Doc: {
        type: "object",
        required: ["id", "projectId", "title", "category", "tags", "uploadedAt", "createdAt"],
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          title: { type: "string" },
          category: { type: "string", enum: ["Contract", "Invoice", "Technical", "Other"] },
          tags: { type: "array", items: { type: "string" } },
          uploadedAt: { type: "string", example: "2026-02-09" },
          createdAt: { type: "string", example: "2026-02-09" },
        },
      },

      Milestone: {
        type: "object",
        required: [
          "id",
          "projectId",
          "title",
          "dueDate",
          "progress",
          "status",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          title: { type: "string" },
          dueDate: { type: "string", example: "2026-03-01" },
          progress: { type: "integer", minimum: 0, maximum: 100 },
          status: { type: "string", enum: ["Draft", "Ready for approval", "Approved"] },
          createdAt: { type: "string", example: "2026-02-09" },
          updatedAt: { type: "string", example: "2026-02-09" },
        },
      },

      Comment: {
        type: "object",
        required: ["id", "ticketId", "authorEmail", "body", "createdAt"],
        properties: {
          id: { type: "string" },
          ticketId: { type: "string" },
          authorEmail: { type: "string" },
          body: { type: "string" },
          createdAt: { type: "string", example: "2026-02-09" },
        },
      },

      Notification: {
        type: "object",
        required: ["id", "type", "message", "createdAt", "read"],
        properties: {
          id: { type: "string" },
          type: { type: "string", example: "info" },
          message: { type: "string" },
          createdAt: { type: "string", example: "2026-02-09" },
          read: { type: "boolean" },
          readAt: { type: ["string", "null"], example: "2026-02-09" },
          projectId: { type: ["string", "null"] },
        },
      },
    },
  },

  // default: all endpoints require cookie unless they explicitly set security: []
  security: [{ cookieAuth: [] }],

  paths: {
    // ---------- OpenAPI ----------
    "/api/openapi": {
      get: {
        tags: ["OpenAPI"],
        summary: "Get OpenAPI spec JSON",
        security: [],
        responses: { 200: { description: "OpenAPI spec JSON" } },
      },
    },

    // ---------- Health ----------
    "/api/health/db": {
      get: {
        tags: ["Health"],
        summary: "DB health check",
        security: [],
        responses: { 200: { description: "OK" } },
      },
    },

    // ---------- Auth ----------
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login (sets cpp_session cookie)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
              examples: {
                demo: { value: { email: "consultant@demo.com", password: "demo123" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "session"],
                  properties: {
                    ok: { type: "boolean" },
                    session: { $ref: "#/components/schemas/Session" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (clears cookie)",
        responses: { 200: { description: "OK" } },
      },
    },

    "/api/auth/session": {
      get: {
        tags: ["Auth"],
        summary: "Get current session (or null)",
        security: [],
        responses: {
          200: {
            description: "Session or null",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "session"],
                  properties: {
                    ok: { type: "boolean" },
                    session: { anyOf: [{ $ref: "#/components/schemas/Session" }, { type: "null" }] },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ---------- Dashboard ----------
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Dashboard payload (summary + projects + notifications)",
        responses: {
          200: {
            description: "Dashboard payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "summary", "projects", "notifications"],
                  properties: {
                    ok: { type: "boolean" },
                    summary: { $ref: "#/components/schemas/DashboardSummary" },
                    projects: { type: "array", items: { $ref: "#/components/schemas/DashboardProject" } },
                    notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                    analytics: {
                      type: "object",
                      required: ["openTickets", "overdueMilestones"],
                      properties: {
                        openTickets: { type: "integer", minimum: 0 },
                        overdueMilestones: { type: "integer", minimum: 0 },
                      },
                      description: "Back-compat field",
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ---------- Projects ----------
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List visible projects",
        responses: {
          200: {
            description: "Projects list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "projects"],
                  properties: {
                    ok: { type: "boolean" },
                    projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project by id",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Project",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "project"],
                  properties: { ok: { type: "boolean" }, project: { $ref: "#/components/schemas/Project" } },
                },
              },
            },
          },
          401: {
            description: "Unauthenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          403: {
            description: "Forbidden",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          404: {
            description: "Not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ---------- Tickets (by project) ----------
    "/api/projects/{projectId}/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List tickets for a project",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Tickets list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "tickets"],
                  properties: {
                    ok: { type: "boolean" },
                    tickets: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
                  },
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Tickets"],
        summary: "Create ticket (consultant/admin)",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["Open", "In progress", "In review", "Blocked", "Done"],
                  },
                  priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
                  assigneeEmail: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Created" },
          400: {
            description: "Invalid request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          403: {
            description: "Forbidden",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/projects/{projectId}/tickets/{ticketId}": {
      get: {
        tags: ["Tickets"],
        summary: "Get ticket by id (scoped to project)",
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "ticketId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Ticket",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "ticket"],
                  properties: { ok: { type: "boolean" }, ticket: { $ref: "#/components/schemas/Ticket" } },
                },
              },
            },
          },
        },
      },

      patch: {
        tags: ["Tickets"],
        summary: "Update ticket (consultant/admin)",
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "ticketId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: { required: true },
        responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },

      delete: {
        tags: ["Tickets"],
        summary: "Delete ticket (consultant/admin)",
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "ticketId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Deleted" }, 403: { description: "Forbidden" } },
      },
    },

    // ---------- Tickets (by id) ----------
    "/api/tickets/{ticketId}": {
      get: {
        tags: ["Tickets"],
        summary: "Get ticket by id",
        parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Ticket with project info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "ticket"],
                  properties: {
                    ok: { type: "boolean" },
                    ticket: { $ref: "#/components/schemas/TicketWithProject" },
                  },
                },
              },
            },
          },
        },
      },

      patch: {
        tags: ["Tickets"],
        summary: "Update ticket (consultant/admin) (legacy endpoint)",
        parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true },
        responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },
    },

    // ---------- Docs ----------
    "/api/projects/{projectId}/docs": {
      get: {
        tags: ["Docs"],
        summary: "List docs for a project",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Docs list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "docs"],
                  properties: {
                    ok: { type: "boolean" },
                    docs: { type: "array", items: { $ref: "#/components/schemas/Doc" } },
                  },
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Docs"],
        summary: "Create doc (consultant/admin)",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  category: { type: "string", enum: ["Contract", "Invoice", "Technical", "Other"] },
                  tags: { type: "array", items: { type: "string" } },
                  uploadedAt: { type: "string", example: "2026-02-09" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Created" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },
    },

    "/api/projects/{projectId}/docs/{docId}": {
      patch: {
        tags: ["Docs"],
        summary: "Update doc (consultant/admin)",
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "docId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: { required: true },
        responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },

      delete: {
        tags: ["Docs"],
        summary: "Delete doc (consultant/admin)",
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "docId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Deleted" }, 403: { description: "Forbidden" } },
      },
    },

    // ---------- Milestones ----------
    "/api/projects/{projectId}/milestones": {
      get: {
        tags: ["Milestones"],
        summary: "List milestones for a project",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Milestones list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "milestones"],
                  properties: {
                    ok: { type: "boolean" },
                    milestones: { type: "array", items: { $ref: "#/components/schemas/Milestone" } },
                  },
                },
              },
            },
          },
        },
      },

      patch: {
        tags: ["Milestones"],
        summary: "Patch milestone (consultant/admin edit; client approve only)",
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true },
        responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },
    },

    // ---------- Comments ----------
    "/api/tickets/{ticketId}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List comments for ticket",
        parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Comments list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "comments"],
                  properties: {
                    ok: { type: "boolean" },
                    comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                  },
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Comments"],
        summary: "Create comment",
        parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["body"],
                    properties: { body: { type: "string" } },
                  },
                  {
                    type: "object",
                    required: ["message"],
                    properties: { message: { type: "string" } },
                    description: "Back-compat (legacy clients)",
                  },
                ],
              },
            },
          },
        },
        responses: { 200: { description: "Created" }, 400: { description: "Invalid request" } },
      },
    },

    // ---------- Notifications ----------
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications for current user",
        responses: {
          200: {
            description: "Notifications list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "notifications"],
                  properties: {
                    ok: { type: "boolean" },
                    notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/notifications/{notificationId}": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark notification read",
        parameters: [{ name: "notificationId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: { action: { type: "string", enum: ["markRead"] } },
              },
            },
          },
        },
        responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 403: { description: "Forbidden" } },
      },
    },
  },
} as const;
