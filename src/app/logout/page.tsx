// FILE: src/app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function safeNextPath(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);

      const params = new URLSearchParams(window.location.search);
      const next = safeNextPath(params.get("next")) || "/dashboard/projects";

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }

    run();
  }, [router]);

  return (
    <main style={{ padding: 24 }}>
      <p>Logging out...</p>
    </main>
  );
}
