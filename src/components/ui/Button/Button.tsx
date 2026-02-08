// FILE: src/components/ui/Button/Button.tsx
"use client";

import styles from "./Button.module.scss";

type Variant = "default" | "primary" | "danger";
type Size = "md" | "sm";

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
    size === "sm" ? styles.small : "",
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
