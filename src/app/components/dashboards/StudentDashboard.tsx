  'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, BookOpen, CheckSquare, ChevronRight, ListTodo, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LessonCard } from '../LessonCard';
import { useCourses } from '@/hooks/useCourses';
import { PageErrorState, PageLoadingState } from '@/app/components/ui/PagePrimitives';

export function StudentDashboard() {
  const t = useTranslations('DashboardStudent');
  const uiT = useTranslations('UiStates');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const router = useRouter();
  const {
    data: coursesData,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourses({ page: 1, limit: 3 });

  const visibleCourses = Array.isArray(coursesData?.items) ? coursesData.items.slice(0, 3) : [];

  if (coursesLoading) {
    return <PageLoadingState title={uiT('loadingTitle')} description={uiT('loadingDescription')} />;
  }

  if (coursesError) {
    return (
      <PageErrorState
        title={uiT('errorTitle')}
        description={coursesError}
        retryLabel={uiT('retry')}
        onRetry={() => {
          void refetchCourses();
        }}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 space-y-8 duration-500">
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-[var(--app-muted)]">
            {t('studyPlan')}
          </h2>
          <button
            onClick={() => router.push('/learning')}
            className="flex items-center gap-1 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)] transition-all hover:bg-[var(--app-surface-soft)]"
          >
            {t('allUnits')} <ChevronRight size={12} />
          </button>
        </div>

        <button
          onClick={() => router.push('/results')}
          className="app-card w-full overflow-hidden border-[color:color-mix(in_srgb,var(--app-accent)_18%,var(--app-border))] bg-[linear-gradient(135deg,#fff9ee_0%,#ffffff_55%,#f8fbf9_100%)] p-5 text-left transition-all active:scale-[0.99] sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#f5d9a6] bg-[#fff2d9] text-[#c78736] shadow-sm sm:h-14 sm:w-14">
                <CheckSquare size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fff1d7] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#c78736]">
                    {t('nextExam')}
                  </span>
                  <span className="rounded-full border border-[#f3deba] bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#9a6a26]">
                    {t('unitExamCountdown')}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-[var(--app-text)] sm:text-xl">
                  {t('unitExamTitle')}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                  {t('unitExamDescription')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end sm:text-right">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  {t('unitExamMetaLabel')}
                </p>
                <p className="mt-1 text-sm font-black text-[var(--app-text)]">{t('unitExamMeta')}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-[14px] bg-[var(--app-primary)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                {t('unitExamAction')}
                <ArrowUpRight size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleCourses.length > 0 ? (
            visibleCourses.map((course: any, idx: number) => (
              <LessonCard
                key={course.id}
                unit={course.level || (idx + 1).toString()}
                title={course.title}
                status={course.isActive === false ? 'locked' : 'done'}
                progress={course.isActive === false ? 0 : Math.max(40, 100 - idx * 20)}
                onClick={() => setSelectedUnit((idx + 1).toString())}
              />
            ))
          ) : (
            <>
              {coursesError ? (
                <div className="rounded-[18px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center text-sm font-semibold text-[var(--app-muted)] lg:col-span-2">
                  {coursesError}
                </div>
              ) : null}
              <LessonCard
                unit="1"
                title={t('fallbackLesson1')}
                status="done"
                progress={100}
                onClick={() => setSelectedUnit('1')}
              />
              <LessonCard
                unit="2"
                title={t('fallbackLesson2')}
                status="done"
                progress={55}
                onClick={() => setSelectedUnit('2')}
              />
              <LessonCard unit="3" title={t('fallbackLesson3')} status="locked" progress={0} />
            </>
          )}
        </div>
      </section>

      <Dialog.Root open={!!selectedUnit} onOpenChange={(open) => !open && setSelectedUnit(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 animate-in fade-in bg-black/35 backdrop-blur-sm duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-1.5rem)] max-w-[360px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.18)] outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 sm:p-8">
            <div className="relative z-10 mb-8 flex items-start justify-between">
              <div>
                <Dialog.Title className="text-2xl font-black tracking-tighter text-[var(--app-text)]">
                  {t('unitTitle', { unit: selectedUnit ?? '' })}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm font-bold uppercase tracking-widest text-[var(--app-muted)]">
                  {t('selectFocus')}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)] transition-all active:scale-90 hover:text-[var(--app-text)]">
                  <X size={20} strokeWidth={3} />
                </button>
              </Dialog.Close>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <button
                onClick={() => router.push(`/unit/${selectedUnit}/vocabulary`)}
                className="flex items-center gap-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-left transition-all active:scale-[0.98] hover:border-[color:color-mix(in_srgb,var(--app-primary)_20%,var(--app-border))] sm:gap-5 sm:p-5"
              >
                <div className="rounded-[14px] bg-[var(--app-surface)] p-4 text-[var(--app-primary)]">
                  <BookOpen size={24} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold tracking-tight text-[var(--app-text)] sm:text-lg">
                    {t('vocabulary')}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-bold tracking-tight text-[var(--app-muted)]">
                    {t('vocabularyDescription')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => router.push(`/unit/${selectedUnit}/tasks`)}
                className="flex items-center gap-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-left transition-all active:scale-[0.98] hover:border-[color:color-mix(in_srgb,var(--app-accent)_24%,var(--app-border))] sm:gap-5 sm:p-5"
              >
                <div className="rounded-[14px] bg-[var(--app-surface)] p-4 text-[var(--app-accent)]">
                  <ListTodo size={24} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold tracking-tight text-[var(--app-text)] sm:text-lg">
                    {t('practice')}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-bold tracking-tight text-[var(--app-muted)]">
                    {t('practiceDescription')}
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-8 flex justify-center pb-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)] opacity-80">
                {t('footer')}
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
