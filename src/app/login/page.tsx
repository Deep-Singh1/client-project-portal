// FILE: src/app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.scss";

function safeNextPath(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // ✅ block protocol-relative redirects
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("client@demo.com");
  const [password, setPassword] = useState("demo123");

  async function onLogin(e?: React.FormEvent) {
    e?.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      alert("Please enter an email.");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      alert(data?.error?.message || "Login failed");
      return;
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
          Demo accounts:
          <br /> client@demo.com / demo123
          <br /> consultant@demo.com / demo123
          <br /> admin@demo.com / demo123
        </p>
      </div>
    </main>
  );
}
