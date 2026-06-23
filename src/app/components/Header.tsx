"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./notifications/NotificationBell";
import { useCenterBranding } from "./branding/CenterBrandingProvider";

interface HeaderProps {
  role?: string | null;
}

export function Header({ role }: HeaderProps) {
  const t = useTranslations("Header");
  const { centerBranding } = useCenterBranding();
  const currentRole = role?.toLowerCase();
  const isTeacher = currentRole === "teacher" || currentRole === "mentor";

  return (
    <div className="animate-fade-up relative z-0 overflow-hidden border-b border-[var(--app-border)] bg-[var(--sidebar)] px-safe pb-3 pt-[calc(0.85rem+var(--app-safe-top))] sm:px-6 sm:pb-4 sm:pt-7">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[1.2rem] font-black tracking-tight text-[var(--app-text)] sm:text-2xl">
              {centerBranding.shortName}
            </h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] sm:text-xs">
              {currentRole === "superadmin"
                ? t("subtitleSuperadmin")
                : currentRole === "admin"
                ? t("subtitleAdmin")
                : isTeacher
                ? t("subtitleTeacher")
                : t("subtitleStudent")}
            </p>
          </div>
          <div className="app-touch group flex h-10 w-10 items-center justify-center border border-[var(--app-border)] bg-white text-[var(--app-primary)] transition-all sm:h-11 sm:w-11">
            <User
              size={20}
              className="transition-transform group-hover:scale-105"
            />
          </div>
        </div>

        {/* Bell + language switcher — hidden on desktop; the Sidebar renders them there */}
        <div className="mt-2 flex items-center gap-2 lg:hidden">
          <NotificationBell />
          <LanguageSwitcher className="border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]" />
        </div>
      </div>
    </div>
  );
}
