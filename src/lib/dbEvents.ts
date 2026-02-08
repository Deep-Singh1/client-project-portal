// FILE: src/lib/dbEvents.ts
export const DB_UPDATED_EVENT = "cpp_db_updated";

export function emitDbUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DB_UPDATED_EVENT));
}

/**
 * Subscribe to db updates in the current tab + across tabs.
 * - same tab: custom event
 * - other tab: storage event (fires when localStorage changes)
 */
export function subscribeDbUpdated(cb: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => cb();
  window.addEventListener(DB_UPDATED_EVENT, handler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === "cpp_db_v1") cb();
    if (e.key === "cpp_session") cb(); // session set/clear
    if (e.key === "cpp_session_updated_at") cb(); // cross-tab ping
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(DB_UPDATED_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
