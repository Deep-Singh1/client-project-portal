// FILE: src/app/dashboard/layout.tsx
import AuthGate from "@/components/AuthGate";
import { ToastProvider } from "@/components/ToastProvider";
import styles from "./dashboardLayout.module.scss";
import DashboardTopbar from "./DashboardTopbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ToastProvider>
        <div className={styles.shell}>
          <DashboardTopbar />
          <main className={styles.main}>{children}</main>
        </div>
      </ToastProvider>
    </AuthGate>
  );
}
