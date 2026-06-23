'use client';

import { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Lock, Search, Sparkles, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/hooks/useCourses';
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from '@/app/components/ui/PagePrimitives';

export default function LearningPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data, loading, error, refetch } = useCourses({
    search: searchTerm,
    page: 1,
    limit: 24,
  });

  const courses = useMemo(() => data.items || [], [data.items]);

  return (
    <PageShell title="Darslar" subtitle="Sizning kurslaringiz">
      <div className="mb-6 flex flex-col gap-3 px-1 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest tracking-tight text-[var(--app-muted)]">
            <Sparkles size={12} className="text-[#2563eb]" /> Sizning kurslaringiz
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 border border-[#f5d9a6] bg-[#fff2d9] px-4 py-2 text-[#c78736]">
          <Trophy size={18} strokeWidth={2.5} />
          <span className="text-[14px] font-black tracking-tighter">LVL 2</span>
        </div>
      </div>

      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Mavzu yoki dars bo'yicha qidirish..."
          className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] py-3.5 pl-11 pr-4 text-sm font-semibold text-[var(--app-text)] transition-all focus:border-[var(--app-primary)] focus:outline-none sm:py-4"
        />
      </div>

      {loading ? (
        <PageLoadingState title="Kurslar yuklanmoqda" description="Sizga tegishli kurslar olinmoqda" />
      ) : error ? (
        <PageErrorState
          title="Kurslarni olishda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 lg:grid-cols-2 sm:gap-6">
          {courses.length > 0 ? (
            courses.map((course: any) => (
              <div
                key={course.id}
                onClick={() => course.isActive !== false && router.push(`/course/${course.id}`)}
                className={`group flex cursor-pointer items-center gap-3 overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition-all hover:border-[color:color-mix(in_srgb,var(--app-secondary)_30%,var(--app-border))] hover:bg-[color:color-mix(in_srgb,var(--app-secondary)_8%,white)] active:scale-[0.98] sm:gap-5 sm:p-6 ${
                  course.isActive === false ? 'opacity-60 grayscale cursor-not-allowed' : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-lg font-black text-[var(--app-primary)] transition-all group-hover:rotate-6 group-hover:bg-[var(--app-secondary)] group-hover:text-white sm:h-16 sm:w-16 sm:text-xl">
                  {course.isActive === false ? <Lock size={24} strokeWidth={2.5} /> : <BookOpen size={24} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-base font-extrabold tracking-tight text-[var(--app-primary-dark)] sm:text-lg">{course.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                    <span className="bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-[var(--app-muted)] whitespace-nowrap">
                      {course.level || 'NO LEVEL'}
                    </span>
                    <span className="bg-[color:color-mix(in_srgb,var(--app-secondary)_10%,white)] px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-[var(--app-primary)] whitespace-nowrap">
                      {course.isActive === false ? 'Locked' : 'Open'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="shrink-0 text-[var(--app-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--app-primary)]" />
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <PageEmptyState
                title="Kurslar topilmadi"
                description="Hozircha sizga tegishli kurslar yoki qidiruvga mos natija yo'q."
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-center pb-10 text-center sm:mt-6 sm:pb-12">
        <p className="text-[10px] font-black uppercase tracking-widest tracking-tighter text-[var(--app-muted)] opacity-80">
          MK ACADEMY LEARNING PATHWAY
        </p>
      </div>
    </PageShell>
  );
}
