// FILE: src/app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.scss";
import { inferRole, setSession } from "@/lib/auth";
import { emitDbUpdated } from "@/lib/dbEvents";

function safeNextPath(raw: string | null) {
  // Only allow internal paths
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("client@demo.com");
  const [password, setPassword] = useState("demo123");

  function onLogin(e?: React.FormEvent) {
    e?.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      alert("Please enter an email.");
      return;
    }

    if (password !== "demo123") {
      alert("Wrong password. Use demo123");
      return;
    }

    const role = inferRole(cleanEmail);
    setSession({ email: cleanEmail, role });

    // ✅ refresh app in same tab
    emitDbUpdated();

    // ✅ notify other tabs (storage event)
    try {
      localStorage.setItem("cpp_session_updated_at", String(Date.now()));
    } catch {
      // ignore
    }

    const params = new URLSearchParams(window.location.search);
    const next = safeNextPath(params.get("next"));

    router.replace(next || "/dashboard/projects");
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={onLogin}>
          <label className={styles.field}>
            Email
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@demo.com"
              autoComplete="username"
            />
          </label>

          <label className={styles.field}>
            Password
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo123"
              autoComplete="current-password"
            />
          </label>

          <button className={styles.button} type="submit">
            Login
          </button>
        </form>

        <p className={styles.hint}>
          Try:
          <br /> client@demo.com / demo123
          <br /> consultant@demo.com / demo123
          <br /> admin@demo.com / demo123
        </p>
      </div>
    </main>
  );
}
