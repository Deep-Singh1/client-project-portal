// FILE: src/components/AuthGate.tsx
"use client";

import React, { useEffect } from "react";
import { useServerSession } from "@/lib/useServerSession";

function safeNextPath(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // block protocol-relative redirects
  return raw;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useServerSession();

  useEffect(() => {
    if (loading) return;
    if (session) return;

    // ✅ No useSearchParams / usePathname — use window location directly
    const current = `${window.location.pathname}${window.location.search}`;
    const next = safeNextPath(current) || "/dashboard/projects";

    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, session]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading session…</p>
      </div>
    );
  }

  // Redirect triggered in effect; render nothing to avoid flicker
  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <p>Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
