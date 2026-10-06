import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "success";
}) {
  const base =
    "control inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold tap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100";
  const styles: Record<string, string> = {
    primary: "accent-gradient text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110",
    ghost: "bg-transparent text-muted-foreground hover:bg-elevated/60 hover:text-foreground",
    outline: "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-elevated/60",
    danger: "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20",
    success: "bg-success/15 text-success border border-success/30 hover:bg-success/20",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface interactive-surface p-4 hover:shadow-[var(--shadow-card)] ${className}`}>{children}</div>;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
      {children}
    </span>
  );
}

export function MutedTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function PRBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`animate-pr-pop inline-flex items-center gap-1 rounded-full bg-gold/15 font-bold text-gold ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M3 7l4.5 3.5L12 4l4.5 6.5L21 7l-1.8 11H4.8z" />
      </svg>
      PR
    </span>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      aria-label={props["aria-label"] ?? props.placeholder}
      className={`control w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
      {...props}
    />
  );
}
