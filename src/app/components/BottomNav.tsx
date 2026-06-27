"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import { stripLocaleFromPathname } from "@/i18n/pathname";
import { localizePath } from "@/i18n/localizedPath";
import { AnimatePresence, motion } from "framer-motion";
import { isNativeApp } from "@/lib/native-app";
import { getNavigationConfig } from "@/lib/navigation-config";

const MAX_PRIMARY_ITEMS = 4;

interface BottomNavProps {
  role?: string | null;
}

export function BottomNav({ role }: BottomNavProps) {
  const t = useTranslations("BottomNav");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const nativeApp = isNativeApp();
  const navItems = getNavigationConfig(role, "bottom");
  const [showMore, setShowMore] = useState(false);

  const hasMore = navItems.length > MAX_PRIMARY_ITEMS;
  const primaryItems = hasMore
    ? navItems.slice(0, MAX_PRIMARY_ITEMS)
    : navItems;
  const overflowItems = hasMore ? navItems.slice(MAX_PRIMARY_ITEMS) : [];

  // "More" button is highlighted when the current route lives in the overflow set,
  // or when the drawer is open.
  const isMoreActive = overflowItems.some(
    (item) =>
      normalizedPathname === item.path ||
      (item.path !== "/" && normalizedPathname.startsWith(item.path))
  );

  return (
    <>
      {/* Tap-outside overlay — sits just below the nav bar (z-119 vs z-120) */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[119] bg-[var(--app-primary)]/10 backdrop-blur-[2px]"
            onClick={() => setShowMore(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] translate-y-0 lg:hidden">
        <div className="pointer-events-auto relative w-full px-0">
          {/* ── Overflow drawer ─────────────────────────────────────────── */}
          <AnimatePresence>
            {hasMore && showMore && (
              <motion.div
                key="more-drawer"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", bounce: 0.18, duration: 0.38 }}
                className="absolute bottom-full left-0 right-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4 shadow-lg"
              >
                <div className="grid grid-cols-2 gap-2">
                  {overflowItems.map((item) => {
                    const isActive =
                      normalizedPathname === item.path ||
                      (item.path !== "/" &&
                        normalizedPathname.startsWith(item.path));
                    const Icon = item.icon;
                    const localizedHref = localizePath(locale, item.path);

                    return (
                      <Link
                        key={item.path}
                        href={localizedHref}
                        onClick={() => setShowMore(false)}
                        className={`app-touch flex min-h-[56px] flex-col items-center justify-center gap-1 border border-transparent px-2 transition-all duration-300 active:scale-95 ${
                          isActive
                            ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                            : "bg-white text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-[var(--app-secondary)] hover:text-[var(--app-primary)]"
                        }`}
                      >
                        <div
                          className={`relative flex items-center justify-center p-2 transition-all duration-300 ${
                            isActive ? "scale-105" : "group-hover:scale-105"
                          }`}
                        >
                          {isActive &&
                            (nativeApp ? (
                              <div className="absolute inset-0 bg-[var(--app-primary)]" />
                            ) : (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-[var(--app-primary)]"
                                transition={{
                                  type: "spring",
                                  bounce: 0.25,
                                  duration: 0.6,
                                }}
                              />
                            ))}
                          <Icon
                            size={22}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="relative z-10"
                          />
                        </div>
                        <span
                          className={`relative z-10 max-w-full truncate text-[10px] font-bold leading-tight ${
                            isActive ? "opacity-100" : "opacity-70"
                          }`}
                        >
                          {t(item.labelKey as any)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main nav bar ─────────────────────────────────────────────── */}
          <div className="flex w-full items-stretch gap-1 border-t border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-surface)_98%,transparent)] px-3 pt-2 pb-[calc(0.75rem+var(--app-safe-bottom))] backdrop-blur-sm">
            {/* Primary nav items (max 4) */}
            {primaryItems.map((item) => {
              const isActive =
                normalizedPathname === item.path ||
                (item.path !== "/" && normalizedPathname.startsWith(item.path));
              const Icon = item.icon;
              const localizedHref = localizePath(locale, item.path);

              return (
                <Link
                  key={item.path}
                  href={localizedHref}
                  className={`app-touch flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 border border-transparent px-1 transition-all duration-300 active:scale-95 ${
                    isActive
                      ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                      : "bg-white text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-[var(--app-secondary)] hover:text-[var(--app-primary)]"
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center p-2 transition-all duration-300 ${
                      isActive ? "scale-105" : "group-hover:scale-105"
                    }`}
                  >
                    {isActive &&
                      (nativeApp ? (
                        <div className="absolute inset-0 bg-[var(--app-primary)]" />
                      ) : (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-[var(--app-primary)]"
                          transition={{
                            type: "spring",
                            bounce: 0.25,
                            duration: 0.6,
                          }}
                        />
                      ))}
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="relative z-10"
                    />
                  </div>
                  <span
                    className={`relative z-10 max-w-full truncate text-[10px] font-bold leading-tight ${
                      isActive ? "opacity-100" : "opacity-70"
                    }`}
                  >
                    {t(item.labelKey as any)}
                  </span>
                </Link>
              );
            })}

            {/* "More" button — only rendered when overflow items exist */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowMore((prev) => !prev)}
                className={`app-touch flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 border border-transparent px-1 transition-all duration-300 active:scale-95 ${
                  isMoreActive || showMore
                    ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                    : "bg-white text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-[var(--app-secondary)] hover:text-[var(--app-primary)]"
                }`}
              >
                <div
                  className={`relative flex items-center justify-center p-2 transition-all duration-300 ${
                    isMoreActive || showMore
                      ? "scale-105"
                      : "group-hover:scale-105"
                  }`}
                >
                  {(isMoreActive || showMore) &&
                    (nativeApp ? (
                      <div className="absolute inset-0 bg-[var(--app-primary)]" />
                    ) : (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[var(--app-primary)]"
                        transition={{
                          type: "spring",
                          bounce: 0.25,
                          duration: 0.6,
                        }}
                      />
                    ))}
                  <MoreHorizontal
                    size={24}
                    strokeWidth={isMoreActive || showMore ? 2.5 : 2}
                    className="relative z-10"
                  />
                </div>
                <span
                  className={`relative z-10 max-w-full truncate text-[10px] font-bold leading-tight ${
                    isMoreActive || showMore ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {t("more")}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
