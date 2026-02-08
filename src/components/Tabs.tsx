"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";

export type Tab = {
  id: string;
  label: string;
};

export function Tabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = "Sections",
}: {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // If activeId becomes invalid (tabs changed), auto-fix by selecting the first tab.
  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some((t) => t.id === activeId)) {
      onChange(tabs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.map((t) => t.id).join("|"), activeId]);

  const activeIndex = useMemo(
    () => tabs.findIndex((t) => t.id === activeId),
    [tabs, activeId]
  );

  function focusTab(index: number) {
    tabRefs.current[index]?.focus();
  }

  function activateByIndex(index: number) {
    const t = tabs[index];
    if (!t) return;
    onChange(t.id);
    focusTab(index);
  }

  if (!tabs.length) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
        onKeyDown={(e) => {
          if (!tabs.length) return;

          const last = tabs.length - 1;

          if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = activeIndex >= 0 ? Math.min(last, activeIndex + 1) : 0;
            activateByIndex(next);
          }

          if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = activeIndex >= 0 ? Math.max(0, activeIndex - 1) : 0;
            activateByIndex(prev);
          }

          if (e.key === "Home") {
            e.preventDefault();
            activateByIndex(0);
          }

          if (e.key === "End") {
            e.preventDefault();
            activateByIndex(last);
          }
        }}
      >
        {tabs.map((t, i) => {
          const selected = t.id === activeId;
          const tabId = `${baseId}-tab-${t.id}`;
          const panelId = `${baseId}-panel-${t.id}`;

          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={tabId}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.id)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: selected ? "#111" : "white",
                color: selected ? "white" : "black",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels are controlled by the parent; parent decides what to render below Tabs */}
      {/* We still output a “current panel id” anchor for accessibility if you want it later */}
      <div
        id={`${baseId}-panel-${activeId}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeId}`}
        hidden
      />
    </div>
  );
}
