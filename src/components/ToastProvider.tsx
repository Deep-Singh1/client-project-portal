"use client";

import React, { createContext, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  function remove(id: string) {
    const t = timersRef.current.get(id);
    if (t) window.clearTimeout(t);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  const value = useMemo(
    () => ({
      push: (t: Omit<Toast, "id">) => {
        const id = `toast_${Math.random().toString(16).slice(2)}_${Date.now()}`;
        const toast: Toast = { id, ...t };
        setToasts((prev) => [toast, ...prev]);

        // auto-remove after 4s
        const timer = window.setTimeout(() => remove(id), 4000);
        timersRef.current.set(id, timer);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* One live region for all toasts */}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "grid",
          gap: 10,
          zIndex: 9999,
          maxWidth: 360,
          width: "calc(100vw - 32px)",
        }}
      >
        {toasts.map((t) => {
          // Errors should be more urgent for screen readers
          const role = t.type === "error" ? "alert" : "status";

          return (
            <div
              key={t.id}
              role={role}
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: 14,
                background: "white",
                padding: 12,
                boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>
                  {t.type === "success" ? "✅ " : t.type === "error" ? "❌ " : "ℹ️ "}
                  {t.title}
                </strong>

                <button
                  onClick={() => remove(t.id)}
                  aria-label="Close notification"
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {t.message ? <div style={{ marginTop: 6, color: "#555" }}>{t.message}</div> : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
