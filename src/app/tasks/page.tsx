'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useApiRequest } from '@/hooks/useApiRequest';
import { listTasks } from '@/lib/backend-api';
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
  SectionHeader,
} from '@/app/components/ui/PagePrimitives';

export default function TasksPage() {
  const navT = useTranslations('BottomNav');
  const uiT = useTranslations('UiStates');
  const { data, loading, error, refetch } = useApiRequest({
    initialData: [] as any[],
    request: () => listTasks(),
    requestKey: 'tasks',
  });

  return (
    <PageShell title={navT('tasks')} subtitle={uiT('loadingDescription')}>
      <SectionHeader title={navT('tasks')} icon={ClipboardList} />

      {loading ? (
        <PageLoadingState title={uiT('loadingTitle')} description={uiT('loadingDescription')} />
      ) : error ? (
        <PageErrorState
          title={uiT('errorTitle')}
          description={error}
          retryLabel={uiT('retry')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : data.length === 0 ? (
        <PageEmptyState
          title={navT('tasks')}
          description="Hozircha topshiriqlar mavjud emas."
        />
      ) : (
        <div className="grid gap-4 pb-nav-safe md:grid-cols-2">
          {data.map((task: any) => (
            <div key={task.id} className="app-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-[14px] bg-[color:color-mix(in_srgb,var(--app-primary)_10%,transparent)] p-3 text-[var(--app-primary)]">
                  <ClipboardList size={18} strokeWidth={2.4} />
                </div>
                {task.type ? (
                  <span className="rounded-full bg-[var(--app-surface-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    {task.type}
                  </span>
                ) : null}
              </div>
              <h3 className="text-lg font-black tracking-tight text-[var(--app-text)]">
                {task.title}
              </h3>
              {task.description ? (
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                  {task.description}
                </p>
              ) : null}
              <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]">
                XP: {task.xpReward ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
