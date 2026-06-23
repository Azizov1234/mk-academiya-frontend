'use client';

import { BellRing } from 'lucide-react';

interface NotificationPermissionPromptProps {
  open: boolean;
  title: string;
  description: string;
  enableLabel: string;
  laterLabel: string;
  onEnable: () => void;
  onLater: () => void;
}

export function NotificationPermissionPrompt({
  open,
  title,
  description,
  enableLabel,
  laterLabel,
  onEnable,
  onLater,
}: NotificationPermissionPromptProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[150] px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-[8px] bg-[color:color-mix(in_srgb,var(--app-primary)_12%,transparent)] p-2 text-[var(--app-primary)]">
            <BellRing size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--app-text)]">{title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-muted)]">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            onClick={onLater}
            className="rounded-[8px] border border-[var(--app-border)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--app-muted)]"
          >
            {laterLabel}
          </button>
          <button
            onClick={onEnable}
            className="rounded-[8px] bg-[var(--app-primary)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white"
          >
            {enableLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
