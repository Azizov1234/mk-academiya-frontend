"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function PageShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up app-page pb-nav-safe pt-4 lg:pb-14 sm:pt-6">
      <div className="mb-5 flex flex-col gap-3 px-1 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-[var(--app-text)] sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] sm:text-[11px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 px-2">
      <h2 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
        {Icon ? <Icon size={14} className="text-[var(--app-primary)]" /> : null}
        {title}
      </h2>
      {action}
    </div>
  );
}

const STAT_TONE_STYLES = {
  primary:
    "bg-[color:color-mix(in_srgb,var(--app-primary)_10%,white)] text-[var(--app-primary)]",
  accent:
    "bg-[color:color-mix(in_srgb,var(--app-accent)_10%,white)] text-[var(--app-accent)]",
  info: "bg-[var(--app-surface-soft)] text-[var(--app-primary)]",
  muted: "bg-[var(--app-surface-soft)] text-[var(--app-muted)]",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: keyof typeof STAT_TONE_STYLES;
}) {
  return (
    <div className="app-card p-4 sm:p-5 cursor-default select-none">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
        <div
          className={`border border-[var(--app-border)] p-2.5 sm:p-3 ${STAT_TONE_STYLES[tone]}`}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {hint ? (
          <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
            {hint}
          </span>
        ) : null}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-black tracking-tight text-[var(--app-text)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export function PageLoadingState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="app-card animate-scale-in overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3 sm:mb-5">
        <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-[var(--app-primary)]">
          <Loader2 size={18} className="animate-spin" />
        </div>
        <div>
          <p className="text-sm font-black text-[var(--app-text)]">{title}</p>
          {description ? (
            <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
          >
            <div className="h-11 w-11 animate-pulse bg-[var(--app-surface-soft)]" />
            <div className="mt-4 h-3 w-24 animate-pulse bg-[var(--app-surface-soft)]" />
            <div className="mt-3 h-6 w-20 animate-pulse bg-[var(--app-surface-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: {
  title: string;
  description?: string | null;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="app-card flex flex-col items-center px-5 py-8 text-center sm:px-6 sm:py-10">
      <div className="border border-[var(--app-border)] bg-[var(--app-secondary)] p-4 text-[var(--app-primary)]">
        <AlertTriangle size={24} strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-[var(--app-text)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm font-semibold text-[var(--app-muted)]">
          {description}
        </p>
      ) : null}
      <button
        onClick={onRetry}
        className="mt-5 border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
      >
        {retryLabel}
      </button>
    </div>
  );
}

export function PageEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="app-card flex flex-col items-center px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-[var(--app-muted)]">
        <Inbox size={24} strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-[var(--app-text)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm font-semibold text-[var(--app-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
