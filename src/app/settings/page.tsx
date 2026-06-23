"use client";

import {
  Bell,
  ChevronRight,
  Crown,
  Download,
  Globe,
  Key,
  Layout,
  LogOut,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { localizePath } from "@/i18n/localizedPath";
import { clearStoredAuth } from "@/lib/auth-storage";
import { logout } from "@/lib/backend-api";
import { useProfile } from "@/hooks/useProfile";
import {
  PageErrorState,
  PageLoadingState,
  PageShell,
} from "@/app/components/ui/PagePrimitives";
import { useCenterBranding } from "@/app/components/branding/CenterBrandingProvider";

type SettingsItem = {
  icon: typeof User;
  label: string;
  value: string;
  path?: string;
  action?: () => void;
};

export default function SettingsPage() {
  const t = useTranslations("SettingsPage");
  const uiT = useTranslations("UiStates");
  const router = useRouter();
  const locale = useLocale();
  const { role } = useAuth();
  const { centerBranding } = useCenterBranding();
  const { data: profile, loading, error, refetch } = useProfile();
  const profileName = profile?.user?.fullName || profile?.fullName || t("loading");
  const profileEmail = profile?.email || profile?.profile?.email || t("loading");
  const profilePhone = profile?.user?.phone || profile?.profile?.phone || profile?.phone || "+998 -- --- -- --";
  const profileLanguage = profile?.language || profile?.profile?.language || "UZ";

  const handleLogout = () => {
    void logout().catch(() => undefined).finally(() => clearStoredAuth()).finally(() => {
      router.push(localizePath(locale, "/"));
    });
  };

  const sections: Array<{ title: string; items: SettingsItem[] }> = [
    {
      title: t("personal"),
      items: [
        {
          icon: User,
          label: t("profileSettings"),
          value: profileName,
          path: "/settings/profile",
        },
        {
          icon: Mail,
          label: t("emailAddress"),
          value: profileEmail,
          path: "/settings/email",
        },
        {
          icon: Phone,
          label: t("phoneNumber"),
          value: profilePhone,
          path: "/settings/phone",
        },
      ],
    },
    {
      title: t("security"),
      items: [
        {
          icon: Key,
          label: t("changePassword"),
          value: t("passwordUpdated"),
          path: "/settings/password",
        },
        {
          icon: Shield,
          label: t("twoFactor"),
          value: t("disabled"),
          path: "/settings/2fa",
        },
      ],
    },
    {
      title: t("downloads"),
      items: [
        {
          icon: Download,
          label: t("mobileApps"),
          value: t("mobileAppsValue"),
          path: "/settings/downloads",
        },
      ],
    },
    ...(role === "superadmin"
      ? [
          {
            title: "Superadmin",
            items: [
              {
                icon: Layout,
                label: "Landing sahifani boshqarish",
                value: "Sayt kontenti, jamoa, kurslar",
                path: "/settings/landing",
              },
            ],
          },
        ]
      : []),
    {
      title: t("system"),
      items: [
        {
          icon: Bell,
          label: t("notifications"),
          value: t("notificationsEnabled"),
          path: "/notifications",
        },
        {
          icon: Globe,
          label: t("language"),
          value:
            profileLanguage === "RU"
              ? t("languages.ru")
              : profileLanguage === "EN"
              ? t("languages.en")
              : t("languages.uz"),
          path: "/settings/language",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <PageLoadingState
        title={uiT("loadingTitle")}
        description={uiT("loadingDescription")}
      />
    );
  }

  if (error) {
    return (
      <PageErrorState
        title={uiT("errorTitle")}
        description={error}
        retryLabel={uiT("retry")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <PageShell title={t("title")}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`border px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${
                role === "superadmin"
                  ? "border-[#f0b7ae] bg-[#fff3f0] text-[#a53b27]"
                  : role === "teacher"
                  ? "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)]"
                  : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)]"
              }`}
            >
              {t("roleLabel", { role: role || "student" })}
            </span>
            {role === "superadmin" ? (
              <Crown size={12} className="text-amber-500" />
            ) : null}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center border border-[var(--app-border)] bg-[var(--app-primary)] text-white sm:h-14 sm:w-14">
          <User size={28} strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="mb-4 px-2 text-[11px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
              {section.title}
            </h2>
            <div className="overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 sm:p-3">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={
                    item.action
                      ? item.action
                      : () =>
                          router.push(localizePath(locale, item.path || "/"))
                  }
                  className="group flex w-full items-center gap-3 border border-transparent p-3.5 transition-all active:scale-[0.98] hover:border-[color:color-mix(in_srgb,var(--app-secondary)_22%,var(--app-border))] hover:bg-[var(--app-secondary)] sm:gap-4 sm:p-4"
                >
                  <div className="shrink-0 border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-[var(--app-primary)] transition-all group-hover:scale-105 group-hover:border-white/20 group-hover:bg-white/20 group-hover:text-white sm:p-3.5">
                    <item.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[14px] font-extrabold text-[var(--app-text)] transition-colors group-hover:text-white sm:text-[15px]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--app-muted)] group-hover:text-white/70 sm:text-[12px]">
                      {item.value}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="flex-shrink-0 text-[var(--app-muted)] transition-all group-hover:translate-x-1 group-hover:text-white"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="group mb-10 mt-4 flex w-full items-center gap-3 border border-[#f0b7ae] bg-[#fff3f0] p-4 text-[#a53b27] transition-all hover:bg-[#ffe7e1] active:scale-[0.98] sm:gap-4 sm:p-6"
        >
          <div className="border border-[#f0b7ae] bg-white p-3.5 text-[#a53b27] transition-transform group-hover:rotate-12">
            <LogOut size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-black uppercase tracking-tight">
              {t("logout")}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">
              {t("logoutDescription", { name: centerBranding.shortName })}
            </p>
          </div>
          <ChevronRight
            size={20}
            strokeWidth={3}
            className="opacity-30 transition-all group-hover:translate-x-1"
          />
        </button>
      </div>

      <div className="mt-6 pb-10 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.3em]">
          {t("version")}
        </p>
      </div>
    </PageShell>
  );
}
