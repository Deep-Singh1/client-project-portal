// FILE: src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, margin: "0 0 8px" }}>Client Project Portal</h1>
      <p style={{ margin: "0 0 24px", color: "#444" }}>
        A portfolio SaaS-style portal for projects, tickets, milestones, docs, and notifications.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/login"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          🔐 Login
        </Link>

        <Link
          href="/dashboard"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          📊 Dashboard
        </Link>

        <Link
          href="/dashboard/projects"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          🗂️ Projects
        </Link>

        <Link
          href="/api-docs"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          📄 API Docs
        </Link>
      </div>

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <h2 style={{ margin: "0 0 8px" }}>Demo accounts</h2>
      <ul style={{ marginTop: 8 }}>
        <li><b>Admin</b>: admin@demo.com / demo123</li>
        <li><b>Consultant</b>: consultant@demo.com / demo123</li>
        <li><b>Client</b>: client@demo.com / demo123</li>
      </ul>
    </main>
  );
}
