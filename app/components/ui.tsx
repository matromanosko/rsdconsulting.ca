import Link from "next/link";
import type { ReactNode } from "react";

// Small label above a heading, led by a square marker.
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-xs font-medium text-foreground ${className}`}>
      <span aria-hidden className="inline-block h-2 w-2 bg-accent" />
      {children}
    </p>
  );
}

// Accent colour for the one or two words a heading hinges on.
export function Hl({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>;
}

// Pill button styles, shared by PillLink and pill-shaped <button>s.
export function pillClass(variant: "dark" | "light" = "dark") {
  const styles =
    variant === "dark"
      ? "bg-ink text-white hover:bg-accent"
      : "border border-border bg-surface text-foreground hover:border-foreground";
  return `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors ${styles}`;
}

export function PillLink({
  href,
  children,
  variant = "dark",
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light";
}) {
  return (
    <Link href={href} className={pillClass(variant)}>
      {children}
    </Link>
  );
}

// Brand mark: three rising bars, the last one in the accent colour.
export function Mark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="13" width="4.5" height="8" rx="1" fill="currentColor" />
      <rect x="9.75" y="8" width="4.5" height="13" rx="1" fill="currentColor" />
      <rect x="16.5" y="3" width="4.5" height="18" rx="1" fill="var(--accent)" />
    </svg>
  );
}
