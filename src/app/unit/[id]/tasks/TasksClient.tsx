'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ClipboardList, Lock, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentProfile, getStudentTasks, submitStudentTask } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import {
  Badge,
  EmptyBlock,
  NoticeBanner,
  SectionTitle,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from '@/app/components/ui/DataDisplay';

type AnyRecord = Record<string, any>;

function getProfileId(profile: AnyRecord | null) {
  const id = Number(profile?.user?.id ?? profile?.id ?? profile?.studentId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getTask(item: AnyRecord) {
  return item?.task ?? item;
}

function getTaskId(item: AnyRecord) {
  const id = Number(item?.task?.id ?? item?.taskId ?? item?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getStatusTone(status: unknown) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'GRADED' || normalized === 'COMPLETED') return 'success' as const;
  if (normalized === 'SUBMITTED') return 'warning' as const;
  return 'muted' as const;
}

export default function TasksClient() {
  const router = useRouter();
  const { id } = useParams();
  const unitId = Number(id);
  const { role, loading: authLoading } = useAuth();
  const [profileId, setProfileId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<AnyRecord[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const profile = await getCurrentProfile();
      const currentProfileId = getProfileId(profile);
      if (!currentProfileId) {
        throw new Error('Student profile topilmadi');
      }

      setProfileId(currentProfileId);
      setTasks(await getStudentTasks(currentProfileId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Vazifalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && role === 'student') {
      void loadTasks();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, role]);

  const unitTasks = useMemo(() => {
    if (!Number.isFinite(unitId)) return tasks;
    return tasks.filter((item) => Number(getTask(item)?.courseId) === unitId);
  }, [tasks, unitId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, item: AnyRecord) {
    event.preventDefault();
    const taskId = getTaskId(item);
    if (!profileId || !taskId) {
      setNotice('Task yoki student ID topilmadi');
      return;
    }

    const content = submissions[taskId]?.trim();
    if (!content) {
      setNotice('Javob matnini kiriting');
      return;
    }

    try {
      setSavingTaskId(taskId);
      setNotice(null);
      await submitStudentTask(profileId, taskId, content);
      setSubmissions((current) => ({ ...current, [taskId]: '' }));
      await loadTasks();
      setNotice('Vazifa yuborildi');
    } catch (submitError) {
      setNotice(submitError instanceof Error ? submitError.message : 'Vazifa yuborilmadi');
    } finally {
      setSavingTaskId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <PageShell title="Unit tasks" subtitle="Vazifalar yuklanmoqda">
        <PageLoadingState title="Vazifalar yuklanmoqda" description="Student task endpointi tekshirilmoqda" />
      </PageShell>
    );
  }

  if (role !== 'student') {
    return (
      <PageShell title="Unit tasks" subtitle="Faqat student akkauntlari uchun">
        <div className="app-card mx-auto flex max-w-xl flex-col items-center px-6 py-10 text-center">
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-rose-600">
            <Lock size={34} strokeWidth={2.5} />
          </div>
          <h2 className="mt-5 text-xl font-black tracking-tight text-[var(--app-text)]">Ruxsat taqiqlangan</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
            Vazifalar faqat student hisobiga ega foydalanuvchilar uchun mo'ljallangan.
          </p>
          <button onClick={() => router.push('/')} className={`${primaryButtonClass} mt-6`}>
            <ArrowLeft size={15} />
            Portalga qaytish
          </button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Unit tasks" subtitle="Xatolik">
        <PageErrorState title="Vazifalar yuklanmadi" description={error} retryLabel="Qayta urinish" onRetry={() => void loadTasks()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Unit ${id} tasks`}
      subtitle="Biriktirilgan vazifalarni ko'ring va javob yuboring"
      action={
        <button onClick={() => router.back()} className={secondaryButtonClass}>
          <ArrowLeft size={14} />
          Orqaga
        </button>
      }
    >
      <NoticeBanner message={notice} />

      <div className="app-card p-5">
        <SectionTitle
          title="Vazifalar"
          description="Bu sahifa endi demo savollar emas, backenddan kelgan student tasklar bilan ishlaydi."
          icon={ClipboardList}
        />
        <div className="space-y-4">
          {unitTasks.map((item) => {
            const task = getTask(item);
            const taskId = getTaskId(item);
            const status = item?.status ?? 'PENDING';
            const alreadySubmitted = ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(String(status).toUpperCase());

            return (
              <article key={`${item?.id ?? taskId}`} className="rounded-lg border border-[var(--app-border)] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge tone={getStatusTone(status)}>{String(status)}</Badge>
                      {task?.type ? <Badge tone="primary">{task.type}</Badge> : null}
                      {task?.maxScore ? <Badge tone="muted">{task.maxScore} ball</Badge> : null}
                    </div>
                    <h2 className="text-base font-black text-[var(--app-text)]">{task?.title ?? `Task #${taskId ?? '-'}`}</h2>
                    {task?.description ? (
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">{task.description}</p>
                    ) : null}
                    {task?.instructions ? (
                      <p className="mt-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-xs font-semibold leading-relaxed text-[var(--app-muted)]">
                        {task.instructions}
                      </p>
                    ) : null}
                  </div>
                  {alreadySubmitted ? (
                    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                      <CheckCircle2 size={15} />
                      Yuborilgan
                    </div>
                  ) : null}
                </div>

                <form onSubmit={(event) => void handleSubmit(event, item)} className="mt-4 grid gap-3">
                  <textarea
                    value={taskId ? submissions[taskId] ?? '' : ''}
                    onChange={(event) => {
                      if (!taskId) return;
                      setSubmissions((current) => ({ ...current, [taskId]: event.target.value }));
                    }}
                    className={textareaClass}
                    placeholder="Javobingizni yozing yoki havola yuboring"
                    disabled={alreadySubmitted || !taskId}
                  />
                  <button className={primaryButtonClass} disabled={alreadySubmitted || !taskId || savingTaskId === taskId}>
                    <Send size={14} />
                    {savingTaskId === taskId ? 'Yuborilmoqda' : 'Yuborish'}
                  </button>
                </form>
              </article>
            );
          })}

          {!unitTasks.length ? (
            <EmptyBlock
              title="Bu unit uchun vazifa yo'q"
              description="Backendda sizga biriktirilgan student task topilmadi yoki task courseId bu unitga mos emas."
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
