import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "./utils";

export const fieldClass =
  "w-full rounded-lg border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--app-text)] outline-none transition-all placeholder:text-[color:color-mix(in_srgb,var(--app-muted)_55%,white)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass = cn(fieldClass, "min-h-24 resize-y");

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--app-primary)] bg-[var(--app-primary)] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--app-primary-dark)] active:scale-95 disabled:pointer-events-none disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--app-primary)] transition-all hover:border-[var(--app-primary)]/40 hover:bg-[var(--app-secondary)] active:scale-95 disabled:pointer-events-none disabled:opacity-60";

export const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition-all hover:border-[var(--app-primary)]/40 hover:bg-[var(--app-secondary)] hover:text-[var(--app-primary)] active:scale-95 disabled:pointer-events-none disabled:opacity-60";

const statToneClasses = {
  primary:
    "bg-[color:color-mix(in_srgb,var(--app-primary)_9%,white)] text-[var(--app-primary)]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  muted: "bg-[var(--app-surface-soft)] text-[var(--app-muted)]",
} as const;

const badgeToneClasses = {
  primary:
    "border-[color:color-mix(in_srgb,var(--app-primary)_28%,var(--app-border))] bg-[color:color-mix(in_srgb,var(--app-primary)_8%,white)] text-[var(--app-primary)]",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  danger: "border-rose-100 bg-rose-50 text-rose-700",
  muted:
    "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)]",
} as const;

export function NoticeBanner({
  message,
  tone = "info",
}: {
  message: string | null;
  tone?: "info" | "success" | "danger";
}) {
  if (!message) return null;

  const toneClass =
    tone === "danger"
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : tone === "success"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-primary)_7%,white)] text-[var(--app-primary)]";

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-bold",
        toneClass,
      )}
    >
      <AlertCircle size={17} className="mt-0.5 shrink-0" strokeWidth={2.5} />
      <span className="min-w-0 leading-relaxed">{message}</span>
    </div>
  );
}

export function CompactStat({
  label,
  value,
  icon: Icon,
  tone = "primary",
  helper,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof statToneClasses;
  helper?: string;
}) {
  return (
    <div className="app-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={cn("rounded-lg border border-[var(--app-border)] p-2.5", statToneClasses[tone])}>
          <Icon size={19} strokeWidth={2.5} />
        </div>
        {helper ? (
          <span className="rounded-md border border-[var(--app-border)] bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
            {helper}
          </span>
        ) : null}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-2 text-[var(--app-primary)]">
              <Icon size={16} strokeWidth={2.5} />
            </span>
          ) : null}
          <h2 className="truncate text-base font-black tracking-tight text-[var(--app-text)]">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--app-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeToneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
        badgeToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function JsonBlock({
  data,
  title = "Texnik ma'lumotlar",
  className,
}: {
  data: unknown;
  title?: string;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)]",
        className,
      )}
    >
      <summary className="cursor-pointer px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        {title}
      </summary>
      <pre className="max-h-72 overflow-auto border-t border-[var(--app-border)] bg-white p-3 text-xs font-semibold leading-relaxed text-[var(--app-text)]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export function EmptyBlock({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-8 text-center",
        className,
      )}
    >
      <Icon size={26} className="mx-auto text-[var(--app-muted)]" strokeWidth={2.5} />
      <p className="mt-3 text-sm font-black text-[var(--app-text)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-relaxed text-[var(--app-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
