// FILE: src/components/ui/Badge/Badge.tsx
import styles from "./Badge.module.scss";

export type Tone =
  | "default"
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export default function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const className = [
    styles.badge,
    tone !== "default" ? (styles as any)[tone] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={className}>{children}</span>;
}
