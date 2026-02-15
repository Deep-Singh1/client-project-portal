// FILE: src/lib/useServerSession.ts
"use client";

import { useEffect, useState } from "react";
import { getServerSession, type SessionUser } from "@/lib/clientSession";

export function useServerSession() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const s = await getServerSession();
      if (!cancelled) {
        setSession(s);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading };
}
