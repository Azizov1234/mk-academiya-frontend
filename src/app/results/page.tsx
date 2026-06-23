'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2, TrendingUp } from 'lucide-react';
import { getDashboardStats, type TestAttempt } from '@/lib/backend-api';
import { useTestAttempts } from '@/hooks/useTestAttempts';
import { PageErrorState, PageEmptyState, PageShell } from '@/app/components/ui/PagePrimitives';

export default function Results() {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptRequest = useTestAttempts(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const statsRes = await getDashboardStats();
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Natijalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    setAttempts((attemptRequest.data ?? []) as TestAttempt[]);
  }, [attemptRequest.data]);

  useEffect(() => {
    if (attemptRequest.error) {
      setError(String(attemptRequest.error));
    }
  }, [attemptRequest.error]);

  if (loading) {
    return (
      <div className="app-page pb-nav-safe pt-4 sm:pt-6">
        <div className="app-card flex items-center justify-center p-10 sm:p-16">
          <Loader2 className="animate-spin text-[var(--app-primary)]" size={36} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page pb-nav-safe pt-4 sm:pt-6">
        <PageErrorState
          title="Natijalarni yuklashda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void fetchData();
            void attemptRequest.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <PageShell title="Sizning Natijalaringiz" subtitle="Testlar va umumiy rivojlanish ko'rsatkichlari">
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="app-card flex flex-col justify-between p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--app-primary)]">
            <TrendingUp size={20} strokeWidth={2.6} />
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">Muvaffaqiyat</span>
          </div>
          <div>
            <p className="text-3xl font-black tracking-tight text-[var(--app-primary-dark)] sm:text-4xl">
              {Math.round(stats?.progress || 0)}%
            </p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              Avg. Score
            </p>
          </div>
        </div>

        <div className="app-card flex flex-col justify-between p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--app-accent)]">
            <Clock size={20} strokeWidth={2.6} />
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">Streak</span>
          </div>
          <div>
            <p className="text-3xl font-black tracking-tight text-[var(--app-primary-dark)] sm:text-4xl">
              {stats?.streak || 0}
              <span className="ml-1 text-[12px] uppercase tracking-widest text-[var(--app-muted)] sm:text-[14px]">
                kun
              </span>
            </p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              Active now
            </p>
          </div>
        </div>

        <div className="app-card hidden flex-col justify-between p-4 lg:flex lg:p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--app-secondary)]">
            <CheckCircle size={20} strokeWidth={2.6} />
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">Vazifalar</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-[var(--app-primary-dark)]">12/48</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              Unit Coverage
            </p>
          </div>
        </div>

        <div className="app-card hidden flex-col justify-between p-4 lg:flex lg:p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--app-primary)]">
            <TrendingUp size={20} strokeWidth={2.6} />
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">Reyting</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-[var(--app-primary-dark)]">#2</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              Guruh ichida
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 mt-10 flex items-center justify-between px-1 sm:mb-6 sm:mt-12 sm:px-2">
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">So&apos;nggi Testlar</h3>
        <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
          Barchasi
        </div>
      </div>

      {attempts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 sm:gap-5">
          {attempts.map((test, idx) => (
            <div
              key={test.id || idx}
              className="group flex items-center justify-between gap-3 border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition-all hover:border-[color:color-mix(in_srgb,var(--app-secondary)_24%,var(--app-border))] hover:bg-[color:color-mix(in_srgb,var(--app-secondary)_8%,white)] active:scale-95 sm:gap-5 sm:p-6"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <div className="shrink-0 border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-[var(--app-primary)] transition-colors group-hover:border-[var(--app-secondary)] group-hover:bg-[var(--app-secondary)] group-hover:text-white sm:p-4">
                  <CheckCircle size={24} strokeWidth={2.5} className="sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-base font-black leading-tight tracking-tight text-[var(--app-primary-dark)] sm:text-lg">
                    {test.test?.title || 'Unknown Test'}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {new Intl.DateTimeFormat('uz-UZ').format(new Date(test.startedAt))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-xl font-black tracking-tight sm:text-2xl ${
                    Number(test.percentage || 0) >= 90 ? 'text-[var(--app-primary)]' : 'text-[var(--app-primary-dark)]'
                  }`}
                >
                  {Math.round(test.percentage || 0)}%
                </span>
                <p
                  className={`mt-1 text-[9px] font-black uppercase tracking-widest ${
                    test.passed ? 'text-[var(--app-primary)]' : 'text-[#a53b27]'
                  }`}
                >
                  {test.passed ? "O'tdi" : "O'tmadi"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PageEmptyState
          title="Hali test topshirilmagan"
          description="Natijalar paydo bo'lishi uchun birinchi testni yakunlang."
        />
      )}
    </PageShell>
  );
}
