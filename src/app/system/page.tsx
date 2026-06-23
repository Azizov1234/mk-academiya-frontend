'use client';

import { Activity, Database, Globe, HardDrive, RefreshCw, Server, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemStats } from '@/hooks/useSystemStats';
import { isRoleAllowedForPath } from '@/lib/role-access';
import {
  PageErrorState,
  PageLoadingState,
  PageShell,
  StatCard,
} from '@/app/components/ui/PagePrimitives';

export default function SystemPage() {
  const { role, loading: authLoading } = useAuth();
  const canAccess = isRoleAllowedForPath('/system', role);
  const { data, loading, error, refetch } = useSystemStats(canAccess && !authLoading);

  if (!authLoading && !canAccess) return null;

  const health = data.health;
  const stats = data.stats;
  const system = stats?.system || {};
  const summary = stats?.summary || {};
  const auditLogs = stats?.auditLogs || [];

  return (
    <PageShell
      title="System"
      subtitle={health?.status ? `Health: ${health.status}` : 'System monitoring'}
      action={
        <button
          onClick={() => {
            void refetch();
          }}
          className="rounded-[16px] bg-[var(--app-primary)] p-3 text-white shadow-lg shadow-black/10 transition-transform active:scale-95"
        >
          <RefreshCw size={20} strokeWidth={2.5} />
        </button>
      }
    >
      {loading ? (
        <PageLoadingState title="System statslari yuklanmoqda" description="Health va resource ma'lumotlari olinmoqda" />
      ) : error ? (
        <PageErrorState
          title="System sahifasida xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="CPU usage" value={`${system.cpuUsage || 0}%`} icon={Activity} tone="primary" />
            <StatCard label="RAM free" value={`${system.ramFree || 0} GB`} icon={Server} tone="info" />
            <StatCard label="Disk" value={`${system.diskSpace || 0} GB`} icon={HardDrive} tone="accent" />
            <StatCard label="Network" value={`${system.networkMs || 0} ms`} icon={Zap} tone="muted" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="app-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className={`rounded-[14px] p-3 ${health?.database === 'connected' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                  <ShieldCheck size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">API health</p>
                  <p className="mt-1 text-lg font-black text-[var(--app-text)]">{health?.status || 'unknown'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Database</p>
                  <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{health?.database || '-'}</p>
                </div>
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Node</p>
                  <p className="mt-2 truncate text-sm font-bold text-[var(--app-text)]">{health?.nodeVersion || system.nodeVersion || '-'}</p>
                </div>
              </div>
            </div>

            <div className="app-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-primary)]">
                  <Database size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Summary</p>
                  <p className="mt-1 text-lg font-black text-[var(--app-text)]">Platform overview</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Users</p>
                  <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{summary.totalUsers || 0}</p>
                </div>
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Groups</p>
                  <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{summary.totalGroups || 0}</p>
                </div>
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Courses</p>
                  <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{summary.totalCourses || 0}</p>
                </div>
                <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Leads</p>
                  <p className="mt-2 text-sm font-bold text-[var(--app-text)]">{summary.totalLeads || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 px-1 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
            <Globe size={14} className="text-[var(--app-primary)]" />
            Audit logs
          </div>
          <div className="grid grid-cols-1 gap-4 pb-20">
            {auditLogs.map((log: any, index: number) => (
              <div key={`${log.title}-${index}`} className="app-card flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
                  <Activity size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold tracking-tight text-[var(--app-text)]">{log.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {log.type}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {log.time}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-text)]">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
