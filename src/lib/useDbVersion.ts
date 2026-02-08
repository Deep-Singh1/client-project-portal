// FILE: src/lib/useDbVersion.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeDbUpdated } from "@/lib/dbEvents";

export function useDbVersion() {
  const [v, setV] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return subscribeDbUpdated(() => {
      // batch multiple quick updates into one rerender
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        setV((x) => x + 1);
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return v;
}
