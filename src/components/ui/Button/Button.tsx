// FILE: src/components/ui/Button/Button.tsx
"use client";

import React from "react";
import styles from "./Button.module.scss";

type Variant = "default" | "primary" | "danger" | "ghost";
type Size = "md" | "sm" | "xs";

export default function Button({
  children,
  variant = "default",
  size = "md",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  const className = [
    styles.button,
    variant === "primary" ? styles.primary : "",
    variant === "danger" ? styles.danger : "",
    variant === "ghost" ? styles.ghost : "",
    size === "sm" ? styles.small : "",
    size === "xs" ? styles.xsmall : "",
    loading ? styles.loading : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={className} disabled={props.disabled || loading}>
      {loading ? "Loading..." : children}
    </button>
  );
}
