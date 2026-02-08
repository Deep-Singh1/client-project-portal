// FILE: src/app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { emitDbUpdated } from "@/lib/dbEvents";

function safeNextPath(raw: string | null) {
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  return null;
}

export default function LogoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    clearSession();

    // ✅ trigger rerenders in this tab (AuthGate uses useDbVersion())
    emitDbUpdated();

    // ✅ trigger other tabs too (storage event)
    try {
      localStorage.setItem("cpp_session_updated_at", String(Date.now()));
    } catch {
      // ignore
    }

    const next =
      safeNextPath(searchParams?.get("next")) ||
      safeNextPath(pathname) ||
      "/dashboard";

    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [router, pathname, searchParams]);

  return (
    <main style={{ padding: 24 }}>
      <p>Logging out...</p>
    </main>
  );
}
