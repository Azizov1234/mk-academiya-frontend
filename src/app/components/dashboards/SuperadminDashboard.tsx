"use client";

import {
  Activity,
  Command,
  Crown,
  Database,
  Globe,
  HardDrive,
  HelpCircle,
  ListChecks,
  PieChart,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";
import {
  PageErrorState,
  PageLoadingState,
  StatCard,
} from "@/app/components/ui/PagePrimitives";

export function SuperadminDashboard() {
  const t = useTranslations("DashboardSuperadmin");
  const uiT = useTranslations("UiStates");
  const { data, loading, error, refetch } = useDashboard();

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

  const alerts = data?.auditLogs || [
    {
      type: t("typeUpdate"),
      title: t("alertUpdate"),
      time: t("time2Hours"),
      status: t("success"),
    },
    {
      type: t("typeIssue"),
      title: t("alertIssue"),
      time: t("time15Minutes"),
      status: t("warning"),
    },
    {
      type: t("typeAudit"),
      title: t("alertAudit"),
      time: t("time5Minutes"),
      status: t("info"),
    },
  ];

  const metrics = [
    {
      label: t("totalUsers"),
      value: (data?.totalUsers || 0).toString(),
      icon: Crown,
      tone: "primary" as const,
    },
    {
      label: t("activeSubscribers"),
      value: (data?.subscribers || 0).toString(),
      icon: ListChecks,
      tone: "info" as const,
    },
    {
      label: t("databaseLoad"),
      value: `${data?.system?.cpuUsage?.toFixed(1) || 0}%`,
      icon: Database,
      tone: "accent" as const,
    },
    {
      label: t("storage"),
      value: `${data?.system?.diskSpace || 0} GB`,
      icon: HardDrive,
      tone: "muted" as const,
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="app-card relative mb-8 overflow-hidden p-8 text-[var(--app-text)]">
        <div className="relative z-10 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-primary)_12%,white)] p-4 text-[var(--app-primary)]">
              <Crown size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-black leading-tight tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)]">
                <span className="h-2 w-2 bg-[var(--app-primary)]" />
                {t("status")}
              </p>
            </div>
          </div>
          <button className="app-touch flex items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-[var(--app-muted)] transition-all active:scale-95">
            <Command size={22} />
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="group border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              <Globe size={13} className="text-[var(--app-primary)]" />{" "}
              {t("globalLoad")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="origin-left text-3xl font-black tracking-tighter transition-transform group-hover:scale-105">
                {data?.system?.uptime || 99}%
              </span>
              <span className="border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-primary)_10%,white)] px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-[var(--app-primary)]">
                {t("stable")}
              </span>
            </div>
          </div>
          <div className="group border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              <Zap size={13} className="text-[var(--app-primary)]" />{" "}
              {t("apiLatency")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="origin-left text-3xl font-black tracking-tighter transition-transform group-hover:scale-105">
                {data?.system?.networkMs || 30}ms
              </span>
              <span className="border border-[var(--app-border)] bg-[color:color-mix(in_srgb,var(--app-primary)_10%,white)] px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-[var(--app-primary)]">
                {t("optimal")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-6 flex items-center gap-3 px-2 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
        <Activity size={16} className="text-[var(--app-primary)]" />{" "}
        {t("realtimeAnalytics")}
      </h2>
      <div className="mb-10 grid grid-cols-2 gap-4 text-[var(--app-text)]">
        {metrics.map((metric, index) => (
          <StatCard
            key={index}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className="px-1 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
          {t("auditLogs")}
        </h2>
        <button className="border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)] transition-all hover:bg-[var(--app-surface-soft)]">
          {t("exploreAll")}
        </button>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        {alerts.map((alert: any, index: number) => (
          <div
            key={index}
            className="app-card flex items-center gap-5 p-5 transition-all active:scale-[0.98]"
          >
            <div
              className={`border border-[var(--app-border)] p-4 ${
                alert.status === t("warning")
                  ? "bg-[var(--app-surface-soft)] text-[var(--app-primary)]"
                  : alert.status === t("success")
                  ? "bg-[var(--app-surface-soft)] text-[var(--app-primary)]"
                  : "bg-[var(--app-surface-soft)] text-[var(--app-primary)]"
              }`}
            >
              <ShieldAlert size={26} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-extrabold leading-tight text-[var(--app-text)]">
                {alert.title}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-[var(--app-muted)]">
                  {alert.type}
                </span>
                <p className="text-[10px] font-bold text-[var(--app-muted)]">
                  {alert.time}
                </p>
              </div>
            </div>
            <button className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3.5 text-[var(--app-muted)] transition-all group-hover:text-[var(--app-primary)]">
              <PieChart size={20} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 pb-8">
        <button className="app-card flex flex-col items-center gap-5 overflow-hidden border border-[var(--app-border)] p-8 text-center transition-all active:scale-95">
          <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-5 text-[var(--app-primary)]">
            <PieChart size={30} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase leading-none tracking-[0.1em] text-[var(--app-text)]">
            {t("annualReport")}
          </span>
        </button>
        <button className="app-card flex flex-col items-center gap-5 overflow-hidden p-8 text-center transition-all active:scale-95">
          <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-5 text-[var(--app-muted)]">
            <Globe size={30} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase leading-none tracking-[0.1em] text-[var(--app-text)]">
            {t("maintenance")}
          </span>
        </button>
      </div>

      <div className="mb-12 mt-4 flex justify-center">
        <button className="flex items-center gap-3 border border-[var(--app-border)] bg-white px-6 py-3.5 text-[11px] font-black text-[var(--app-muted)] transition-all hover:text-[var(--app-text)]">
          <HelpCircle size={16} className="text-[var(--app-primary)]" />
          <span className="uppercase tracking-widest opacity-80">
            {t("documentation")}
          </span>
        </button>
      </div>
    </div>
  );
}
