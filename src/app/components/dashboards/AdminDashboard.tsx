'use client';

import {
  Activity,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquare,
  PlusCircle,
  Presentation,
  School,
  Settings,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/hooks/useDashboard';
import { PageErrorState, PageLoadingState, StatCard } from '@/app/components/ui/PagePrimitives';

export function AdminDashboard() {
  const t = useTranslations('DashboardAdmin');
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

  const stats = [
    { label: t('totalStudents'), value: (data?.totalStudents || 0).toLocaleString(), icon: Users, hint: `+${data?.recentRegistrations || 0}`, tone: 'primary' as const },
    { label: t('averageResult'), value: `${data?.averageResult || 0}%`, icon: ClipboardList, hint: '+3%', tone: 'info' as const },
    { label: t('activeGroups'), value: `${data?.activeGroups || 0} ta`, icon: Presentation, hint: '+2', tone: 'accent' as const },
    { label: t('centerScore'), value: '4.8', icon: School, hint: 'Top', tone: 'muted' as const },
  ];

  const actions = [
    { label: t('newCourse'), desc: t('newCourseDescription'), icon: PlusCircle },
    { label: t('leads'), desc: t('leadsDescription'), icon: MessageSquare },
    { label: t('mentors'), desc: t('mentorsDescription'), icon: UserPlus },
    { label: t('exams'), desc: t('examsDescription'), icon: FileText },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="mb-10 flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="app-card bg-[var(--app-surface)] p-4 transition-all">
            <Shield size={28} className="text-[var(--app-primary)]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--app-text)]">{t('title')}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.15em] text-[var(--app-muted)]">
              <span className="h-1.5 w-1.5 bg-[var(--app-primary)]" />
              {t('status')}
            </p>
          </div>
        </div>
        <button className="app-touch flex items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-[var(--app-muted)] transition-all hover:text-[var(--app-text)] active:scale-95">
          <Settings size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} label={stat.label} value={stat.value} icon={stat.icon} hint={stat.hint} tone={stat.tone} />
        ))}
      </div>

      <h2 className="mb-6 flex items-center justify-between px-3 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
        {t('quickActions')}
        <Activity size={16} className="text-[var(--app-primary)]" />
      </h2>
      <div className="flex flex-col gap-4 pb-12">
        {actions.map((action, index) => (
          <button
            key={index}
            className="app-card group flex items-center gap-5 p-6 text-left transition-all active:scale-[0.98] hover:border-[color:color-mix(in_srgb,var(--app-primary)_28%,var(--app-border))]"
          >
            <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-5 text-[var(--app-primary)] transition-transform group-hover:scale-105">
              <action.icon size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold leading-tight text-[var(--app-text)]">{action.label}</h3>
              <p className="mt-1 truncate text-[11px] font-bold tracking-tight text-[var(--app-muted)]">{action.desc}</p>
            </div>
            <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-2.5 text-[var(--app-muted)] transition-all group-hover:text-[var(--app-primary)]">
              <ChevronRight size={20} strokeWidth={3} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-center pb-8">
        <button className="flex items-center gap-2 border border-[var(--app-border)] bg-white px-6 py-3 text-[11px] font-black uppercase leading-none tracking-widest text-[var(--app-muted)] transition-all hover:text-[var(--app-primary)]">
          <TrendingUp size={16} /> {t('viewDetailedStats')}
        </button>
      </div>
    </div>
  );
}
