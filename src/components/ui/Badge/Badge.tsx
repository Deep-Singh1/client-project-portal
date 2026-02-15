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
  const toneClass =
    tone !== "default" ? styles[tone as keyof typeof styles] : "";

  const className = [styles.badge, toneClass].filter(Boolean).join(" ");

  return <span className={className}>{children}</span>;
}
