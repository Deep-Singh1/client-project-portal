// FILE: src/app/dashboard/layout.tsx
import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import { ToastProvider } from "@/components/ToastProvider";
import styles from "./dashboardLayout.module.scss";
import DashboardTopbar from "./DashboardTopbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ToastProvider>
        {/* ✅ Required when children (or layout components) use useSearchParams() */}
        <Suspense fallback={<div style={{ padding: 24 }}>Loading dashboard…</div>}>
          <div className={styles.shell}>
            <DashboardTopbar />
            <main className={styles.main}>{children}</main>
          </div>
        </Suspense>
      </ToastProvider>
    </AuthGate>
  );
}
