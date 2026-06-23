"use client";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./notifications/NotificationBell";
import { stripLocaleFromPathname } from "@/i18n/pathname";
import { localizePath } from "@/i18n/localizedPath";
import { getNavigationConfig } from "@/lib/navigation-config";
import { clearStoredAuth } from "@/lib/auth-storage";
import { logout } from "@/lib/backend-api";
import { useSystemHealth } from "@/hooks/useSystemStats";
import { useCenterBranding } from "./branding/CenterBrandingProvider";

interface SidebarProps {
  role?: string | null;
}

export function Sidebar({ role }: SidebarProps) {
  const router = useRouter();
  const t = useTranslations("Sidebar");
  const commonT = useTranslations("Common");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const navItems = getNavigationConfig(role, "sidebar");
  const { data: health } = useSystemHealth(normalizedPathname !== "/system");
  const { centerBranding } = useCenterBranding();
  const systemHealthy = ["ok", "healthy"].includes(
    String(health?.status || "").toLowerCase()
  );

  function handleLogout() {
    void logout()
      .catch(() => undefined)
      .finally(() => clearStoredAuth())
      .finally(() => {
        router.push(localizePath(locale, "/"));
      });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-[120] hidden h-dvh w-72 overflow-hidden border-r border-[var(--app-border)] bg-[var(--sidebar)] lg:block animate-slide-right">
      <div className="flex h-full flex-col overflow-hidden overscroll-none">
        <div className="shrink-0 border-b border-[var(--app-border)] p-6 xl:p-8">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden border border-[var(--app-border)] bg-white">
              <img
                src={centerBranding.logoUrl}
                alt={centerBranding.shortName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black leading-tight tracking-tight text-[var(--app-text)] xl:text-lg">
                {centerBranding.shortName}
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
                {t("brandSub")}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-stretch gap-2">
            <NotificationBell className="shrink-0" />
            <LanguageSwitcher className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]" />
          </div>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                normalizedPathname === item.path ||
                (item.path !== "/" && normalizedPathname.startsWith(item.path));
              const Icon = item.icon;
              const localizedHref = localizePath(locale, item.path);

              return (
                <Link
                  key={item.path}
                  href={localizedHref}
                  prefetch={false}
                  className={`flex items-center gap-4 border px-5 py-3.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white shadow-sm shadow-[var(--app-primary)]/20"
                      : "border-transparent bg-white text-[var(--app-text)] hover:border-[var(--app-primary)]/30 hover:bg-[var(--app-primary)] hover:text-white"
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 2}
                    className="transition-transform group-hover:scale-105"
                  />
                  <span
                    className={`text-[13px] tracking-tight ${
                      isActive ? "font-black" : "font-bold"
                    }`}
                  >
                    {t(item.labelKey as any)}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto shrink-0 p-6">
          <div className="mb-6 border border-[var(--app-border)] bg-white p-5">
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  systemHealthy ? "bg-[var(--app-primary)]" : "bg-red-500"
                }`}
              />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none text-[var(--app-primary)]">
                {systemHealthy ? t("statusHealthy") : commonT("systemStatus")}
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden bg-[color:color-mix(in_srgb,var(--app-primary)_10%,white)]">
              <div
                className={`h-full transition-all duration-300 ${
                  systemHealthy
                    ? "w-full bg-[var(--app-primary)]"
                    : "w-2/5 bg-red-500"
                }`}
              />
            </div>
            <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
              Tizim holati
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 border border-transparent bg-white px-6 py-4 text-[13px] font-extrabold text-red-500 transition-all duration-200 group hover:border-red-200 hover:bg-red-500 hover:text-white"
          >
            <LogOut
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
            {commonT("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
