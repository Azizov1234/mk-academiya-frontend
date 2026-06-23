'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Send, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getTestById,
  getQuestionsByTest,
  normalizeQuestionOptionItems,
  startTestAttempt,
  submitTestAttempt,
  submitTestAttemptRecord,
  type TestAttempt,
  type TestItem,
} from '@/lib/backend-api';
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from '@/app/components/ui/PagePrimitives';

function getReadableError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function getAttemptStartedAt(attempt: TestAttempt | null) {
  if (!attempt?.startedAt) return Date.now();
  const parsed = new Date(attempt.startedAt).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export default function TestRunnerClient({ testId }: { testId: number }) {
  const router = useRouter();
  const [test, setTest] = useState<TestItem | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [result, setResult] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>(
    {},
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    async function loadTest() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTestById(testId);
        if (!data.questions?.length) {
          const questions = await getQuestionsByTest(testId).catch(() => []);
          if (mounted) setTest({ ...data, questions });
        } else if (mounted) {
          setTest(data);
        }
      } catch (loadError) {
        if (mounted) setError(getReadableError(loadError, "Testni yuklab bo'lmadi"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadTest();

    return () => {
      mounted = false;
    };
  }, [testId]);

  useEffect(() => {
    if (!attempt || result) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, result]);

  const activeQuestions = useMemo(
    () => test?.questions?.filter((question) => question.isActive !== false) ?? [],
    [test?.questions],
  );
  const durationMinutes = test?.timeLimitMinutes ?? test?.timeLimit ?? test?.duration ?? null;
  const startedAt = getAttemptStartedAt(attempt);
  const spentSeconds = attempt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const timeLimitSeconds = durationMinutes ? durationMinutes * 60 : null;
  const remainingSeconds = timeLimitSeconds ? Math.max(0, timeLimitSeconds - spentSeconds) : null;
  const answeredCount = activeQuestions.filter((question) => ![undefined, null, ''].includes(answers[String(question.id)] as any)).length;

  function validateQuestionAnswers() {
    const nextErrors: Record<string, string> = {};

    activeQuestions.forEach((question) => {
      const key = String(question.id);
      const value = answers[key];

      if ([undefined, null, ''].includes(value as any)) {
        nextErrors[key] = 'Ushbu savol belgilanmadi';
        return;
      }

      const options = normalizeQuestionOptionItems(question.options);
      if (
        options.length > 0 &&
        !options.some(
          (option) => option.label === String(value).trim().toUpperCase(),
        )
      ) {
        nextErrors[key] = 'Javob mavjud variantlardan tanlanishi kerak';
      }
    });

    return nextErrors;
  }

  function updateAnswer(questionId: number, value: unknown) {
    const key = String(questionId);
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
    setQuestionErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function handleStart() {
    try {
      setStarting(true);
      setFormError(null);
      setQuestionErrors({});
      const response = await startTestAttempt(testId);
      setAttempt(response.data);
      setTest(response.test || test);
      setResult(null);
      setAnswers({});
      setNow(Date.now());
    } catch (startError) {
      setFormError(getReadableError(startError, "Attemptni boshlashda xatolik bo'ldi"));
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (!test || !attempt) return;

    try {
      setSubmitting(true);
      setFormError(null);
      setQuestionErrors({});

      const nextQuestionErrors = validateQuestionAnswers();
      if (Object.keys(nextQuestionErrors).length) {
        setQuestionErrors(nextQuestionErrors);
        return;
      }

      const submitPayload = {
        testId: test.id,
        attemptId: attempt.id,
        answers,
        timeSpentSeconds: spentSeconds,
      };

      let submitted: TestAttempt;
      try {
        submitted = await submitTestAttempt(test.id, submitPayload, test);
      } catch (primarySubmitError) {
        const message = getReadableError(primarySubmitError, '');
        if (!/404|not found|cannot post/i.test(message)) {
          throw primarySubmitError;
        }
        submitted = await submitTestAttemptRecord(submitPayload);
      }

      setResult(submitted);
    } catch (submitError) {
      setFormError(getReadableError(submitError, "Testni yuborib bo'lmadi"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Test" subtitle="Ma'lumotlar olinmoqda">
        <PageLoadingState title="Test yuklanmoqda" description="Savollar va sozlamalar tekshirilmoqda" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Test" subtitle="Xatolik">
        <PageErrorState
          title="Testni ochib bo'lmadi"
          description={error}
          retryLabel="Orqaga"
          onRetry={() => router.push('/tests')}
        />
      </PageShell>
    );
  }

  if (!test) {
    return (
      <PageShell title="Test" subtitle="Topilmadi">
        <PageEmptyState title="Test topilmadi" description="Bu test mavjud emas yoki sizga biriktirilmagan." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={test.title}
      subtitle={`${activeQuestions.length} savol${durationMinutes ? ` * ${durationMinutes} daqiqa` : ''}`}
      action={
        <button
          onClick={() => router.push('/tests')}
          className="flex items-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-text)]"
        >
          <ArrowLeft size={14} />
          Orqaga
        </button>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Holat</p>
          <p className="mt-2 text-lg font-black text-[var(--app-text)]">
            {result ? (result.passed ? "O'tdi" : "O'tmadi") : attempt ? 'Jarayonda' : 'Boshlanmagan'}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Javoblar</p>
          <p className="mt-2 text-lg font-black text-[var(--app-text)]">{answeredCount}/{activeQuestions.length}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Vaqt</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-black text-[var(--app-text)]">
            <Clock size={18} />
            {remainingSeconds !== null ? formatDuration(remainingSeconds) : formatDuration(spentSeconds)}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Passing</p>
          <p className="mt-2 text-lg font-black text-[var(--app-text)]">{test.passingScore ?? 0}%</p>
        </div>
      </div>

      {test.description ? (
        <div className="mb-5 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
          {test.description}
        </div>
      ) : null}

      {formError ? (
        <div className="mb-5 whitespace-pre-line rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {formError}
        </div>
      ) : null}

      {!attempt ? (
        <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center">
          <h2 className="text-xl font-black tracking-tight text-[var(--app-text)]">Testga tayyormisiz?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
            Boshlash tugmasi bosilgach attempt backendda yaratiladi. Javoblar faqat backend tomonidan tekshiriladi.
          </p>
          <button
            onClick={() => void handleStart()}
            disabled={starting || activeQuestions.length === 0}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-[16px] bg-[var(--app-primary)] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            {starting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Boshlash
          </button>
        </div>
      ) : null}

      {attempt ? (
        <div className="space-y-4 pb-24">
          {activeQuestions.map((question, index) => {
            const options = normalizeQuestionOptionItems(question.options);
            const value = answers[String(question.id)] ?? '';
            const questionError = questionErrors[String(question.id)];
            const graded = result?.answers?.results?.find?.((item: any) => Number(item.questionId) === question.id);

            return (
              <div
                key={question.id}
                className={`rounded-[22px] border p-5 transition-colors ${
                  questionError
                    ? 'border-red-300 bg-red-50/80'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {index + 1}-savol * {question.points || 1} ball
                    </p>
                    <h3 className="mt-2 text-base font-black leading-relaxed text-[var(--app-text)]">
                      {question.questionText}
                    </h3>
                  </div>
                  {graded ? (
                    <div
                      className={`rounded-full p-2 ${
                        graded.isCorrect ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {graded.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                  ) : null}
                </div>

                {options.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {options.map((option) => {
                      const selected = value === option.label;
                      return (
                        <button
                          key={option.label}
                          onClick={() =>
                            !result &&
                            updateAnswer(question.id, option.label)
                          }
                          className={`rounded-[16px] border px-4 py-3 text-left text-sm font-bold transition-transform active:scale-95 ${
                            selected
                              ? 'border-[var(--app-primary)] bg-[color:color-mix(in_srgb,var(--app-primary)_10%,transparent)] text-[var(--app-primary)]'
                              : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]'
                          } ${result ? 'cursor-default' : ''}`}
                        >
                          {option.label}) {option.value}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={String(value)}
                    disabled={Boolean(result)}
                    onChange={(event) =>
                      updateAnswer(question.id, event.target.value)
                    }
                    placeholder="Javobingizni yozing..."
                    className="min-h-28 w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] disabled:opacity-70"
                  />
                )}

                {questionError ? (
                  <div className="mt-4 rounded-[16px] border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
                    {questionError}
                  </div>
                ) : null}

                {graded ? (
                  <div className="mt-4 rounded-[16px] bg-[var(--app-surface-soft)] p-4 text-sm font-semibold text-[var(--app-muted)]">
                    <p>
                      Natija: {graded.earnedPoints}/{graded.points} ball
                    </p>
                    {graded.explanation ? <p className="mt-2">{graded.explanation}</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!result ? (
            <div className="sticky bottom-20 z-20 flex justify-end lg:bottom-6">
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting || activeQuestions.length === 0}
                className="flex items-center justify-center gap-2 rounded-[16px] bg-[var(--app-primary)] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Yuborish
              </button>
            </div>
          ) : (
            <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Yakuniy natija</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-[var(--app-text)]">
                {Math.round(result.percentage || 0)}%
              </h2>
              <p className={`mt-2 text-sm font-black ${result.passed ? 'text-blue-600' : 'text-red-600'}`}>
                {result.passed ? "Tabriklaymiz, testdan o'tdingiz" : "Testdan o'tish uchun yana tayyorlaning"}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </PageShell>
  );
}
