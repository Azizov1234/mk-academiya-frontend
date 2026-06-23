'use client';

import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  MessageSquarePlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/hooks/useDashboard';
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/app/components/ui/PagePrimitives';

export function MentorDashboard() {
  const t = useTranslations('DashboardMentor');
  const uiT = useTranslations('UiStates');
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return <PageLoadingState title={uiT('loadingTitle')} description={uiT('loadingDescription')} />;
  }

  if (error) {
    return (
      <PageErrorState
        title={uiT('errorTitle')}
        description={error}
        retryLabel={uiT('retry')}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const groups = data?.myGroups || [];

  if (groups.length === 0) {
    return <PageEmptyState title={t('emptyGroupsTitle')} description={t('emptyGroupsDescription')} />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="app-card bg-mesh mb-8 overflow-hidden border border-[var(--app-border)] p-8 text-[var(--app-text)]">
        <div className="relative z-10 mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--app-primary)]" />
              <p className="text-[10px] font-black uppercase leading-none tracking-[0.2em] text-[var(--app-muted)]">
                {t('activeTeachingSession')}
              </p>
            </div>
            <h2 className="text-2xl font-black leading-tight tracking-tight">Mirasror Ali</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">{t('roleTitle')}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-[var(--app-primary)] shadow-sm">
            <GraduationCap size={28} />
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="flex-1 cursor-default rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <p className="mb-2 text-[9px] font-black uppercase leading-none tracking-widest text-[var(--app-muted)]">
              {t('activeGroups')}
            </p>
            <p className="text-2xl font-black tracking-tighter">{data?.activeGroups || groups.length} ta</p>
          </div>
          <div className="flex-1 cursor-default rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <p className="mb-2 text-[9px] font-black uppercase leading-none tracking-widest text-[var(--app-muted)]">
              {t('pendingHomework')}
            </p>
            <p className="text-2xl font-black tracking-tighter">{data?.pendingHomeworks || 0} ta</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-2 px-1 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
          <Calendar size={14} className="text-[var(--app-primary)]" /> {t('groupsTitle')}
        </h2>
        <button className="rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)] transition-all hover:bg-[var(--app-surface-soft)]">
          {t('schedule')}
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group: any, index: number) => (
          <div key={index} onClick={() => window.location.href = `/groups/${group.id}`} className="app-card group flex cursor-pointer items-center gap-5 p-6 transition-all active:scale-[0.98]">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[var(--app-surface-soft)] text-xl font-black text-[var(--app-primary)] shadow-inner transition-all group-hover:bg-[color:color-mix(in_srgb,var(--app-primary)_12%,white)]">
              {(group.name || '?').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-extrabold leading-tight tracking-tight text-[var(--app-text)]">{group.name}</h3>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-md bg-[var(--app-surface-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-tighter text-[var(--app-muted)]">
                  <Users size={12} strokeWidth={2.5} /> {t('students', { count: group.students || 0 })}
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-[var(--app-primary)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-tighter text-[var(--app-primary)]">
                  <BookOpen size={12} strokeWidth={2.5} /> {group.lessons || '0/0'}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="rounded-full bg-[var(--app-surface-soft)] px-2.5 py-1.5 text-[10px] font-black uppercase leading-none tracking-widest text-[var(--app-muted)]">
                {group.nextLesson || 'Soon'}
              </span>
              <div className="rounded-[12px] bg-[var(--app-surface-soft)] p-2.5 text-[var(--app-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--app-primary)]">
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <button className="app-card group relative flex flex-col items-center gap-5 overflow-hidden p-8 text-center transition-all active:scale-95">
          <div className="absolute right-2 top-2 flex gap-1">
            {(data?.pendingHomeworks || 0) > 0 ? <span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-400 opacity-75" /> : null}
          </div>
          <div className="rounded-[16px] bg-red-50 p-5 text-red-500 shadow-inner shadow-red-100 transition-all group-hover:scale-105">
            <AlertCircle size={28} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase leading-tight tracking-tight text-[var(--app-text)]">
            {t('uncheckedTasks', { count: data?.pendingHomeworks || 0 })}
          </span>
        </button>
        <button className="app-card group flex flex-col items-center gap-5 p-8 text-center transition-all active:scale-95">
          <div className="rounded-[16px] bg-[var(--app-surface-soft)] p-5 text-[var(--app-primary)] shadow-inner transition-all group-hover:scale-105">
            <BarChart3 size={28} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase leading-tight tracking-tight text-[var(--app-text)]">{t('groupAnalytics')}</span>
        </button>
      </div>

      <button className="btn-premium mb-12 w-full border-none bg-[var(--app-primary)] p-6 text-white">
        <MessageSquarePlus size={22} strokeWidth={2.5} className="mr-3" />
        <span className="tracking-widest">{t('newTask')}</span>
      </button>
    </div>
  );
}
