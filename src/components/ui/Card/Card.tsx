// FILE: src/components/ui/Card/Card.tsx
import styles from "./Card.module.scss";

export default function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
