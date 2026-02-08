// FILE: src/components/AuthGate.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth";
import { useDbVersion } from "@/lib/useDbVersion";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dbVersion = useDbVersion();

  const session = useMemo(() => getSession(), [dbVersion]);

  const next = useMemo(() => {
    const p = pathname ?? "/dashboard";
    const qs = searchParams?.toString();
    return qs ? `${p}?${qs}` : p;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [session, next, router]);

  if (!session) return null;

  return <>{children}</>;
}
