'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle, Trophy } from 'lucide-react';
import {
  type CefrLevel,
  CEFR_LEVELS,
  PUBLIC_EXAM_DIRECTIONS,
  PUBLIC_EXAM_MODES,
  getPublicExamById,
  listPublicExams,
  normalizeQuestionOptionItems,
  submitPublicExam,
  type PublicExamCatalogItem,
  type PublicExamDirection,
  type PublicExamMode,
  type PublicExamResult,
  type TestItem,
} from '@/lib/backend-api';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function PublicExamPage() {
  const [participantName, setParticipantName] = useState('');
  const [selectedMode, setSelectedMode] = useState<PublicExamMode>('LEVEL');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('A1');
  const [selectedDirection, setSelectedDirection] = useState<PublicExamDirection>(
    PUBLIC_EXAM_DIRECTIONS[0],
  );
  const [catalog, setCatalog] = useState<PublicExamCatalogItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [test, setTest] = useState<TestItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [step, setStep] = useState<'setup' | 'exam' | 'result'>('setup');
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PublicExamResult | null>(null);

  const isLevelMode = selectedMode === 'LEVEL';

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        setCatalogError(null);
        const response = await listPublicExams({
          mode: selectedMode,
          level: isLevelMode ? selectedLevel : '',
          direction: isLevelMode ? '' : selectedDirection,
          limit: 200,
        });
        const items = response.data || [];
        setCatalog(items);
        setSelectedTestId((currentId) => {
          if (items.length === 0) return null;
          return items.some((item) => item.id === currentId) ? currentId : items[0].id;
        });
      } catch (error) {
        setCatalogError(getErrorMessage(error, 'Failed to load public exams'));
      } finally {
        setLoadingCatalog(false);
      }
    };

    void fetchCatalog();
  }, [isLevelMode, selectedDirection, selectedLevel, selectedMode]);

  const selectedTest = useMemo(
    () => catalog.find((item) => item.id === selectedTestId) || null,
    [catalog, selectedTestId],
  );

  const questionCount = test?.questions?.length || 0;

  function validateQuestionAnswers() {
    const nextErrors: Record<string, string> = {};

    (test?.questions || []).forEach((question) => {
      const key = String(question.id);
      const value = answers[key];

      if ([undefined, null, ''].includes(value as any)) {
        nextErrors[key] = 'This question is not answered';
        return;
      }

      const options = normalizeQuestionOptionItems(question.options);
      if (
        options.length > 0 &&
        !options.some((option) => option.label === String(value).trim().toUpperCase())
      ) {
        nextErrors[key] = 'Please choose one of the available options';
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

  async function handleStartExam() {
    try {
      setSetupError(null);
      if (!participantName.trim()) {
        setSetupError('Please enter your first name before starting.');
        return;
      }

      if (!selectedTestId) {
        setSetupError('Please choose a test to continue.');
        return;
      }

      if (selectedMode === 'LEVEL' && !selectedLevel) {
        setSetupError('Please choose a level test.');
        return;
      }

      if (selectedMode === 'TRACK' && !selectedDirection) {
        setSetupError('Please choose a track test.');
        return;
      }

      const loadedTest = await getPublicExamById(selectedTestId);
      setTest(loadedTest);
      setAnswers({});
      setQuestionErrors({});
      setResult(null);
      setStartedAtMs(Date.now());
      setStep('exam');
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Failed to open selected test'));
    }
  }

  async function handleSubmitExam() {
    if (!test) return;

    try {
      setSubmitting(true);
      setSetupError(null);
      setQuestionErrors({});

      const nextQuestionErrors = validateQuestionAnswers();
      if (Object.keys(nextQuestionErrors).length) {
        setQuestionErrors(nextQuestionErrors);
        return;
      }

      const elapsed =
        startedAtMs && startedAtMs > 0
          ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
          : undefined;

      const submitResult = await submitPublicExam(test.id, {
        participantName: participantName.trim(),
        selectedMode,
        selectedLevel: selectedMode === 'LEVEL' ? selectedLevel : undefined,
        selectedDirection: selectedMode === 'TRACK' ? selectedDirection : undefined,
        answers,
        timeSpentSeconds: elapsed,
      });

      setResult(submitResult);
      setStep('result');
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Failed to submit exam'));
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setStep('setup');
    setTest(null);
    setAnswers({});
    setQuestionErrors({});
    setStartedAtMs(null);
    setResult(null);
    setSetupError(null);
  }

  return (
    <div className="app-page pb-16 pt-6 sm:pt-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)]"
        >
          <ArrowLeft size={16} />
          Bosh sahifaga
        </Link>
        <Link
          href="/public-rating"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]"
        >
          <Trophy size={16} />
          Umumiy reyting
        </Link>
      </div>

      {step === 'setup' ? (
        <section className="app-card p-5 sm:p-7">
          <h1 className="text-2xl font-black text-[var(--app-text)] sm:text-3xl">
            Ingliz tili placement imtihoni
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--app-muted)]">
            Imtihon turini tanlang, darhol boshlang va taxminiy darajangizni oling.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--app-text)]">
              Ism
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                placeholder="Ismingizni kiriting"
                className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--app-text)]">
              Imtihon turi
              <select
                value={selectedMode}
                onChange={(event) => setSelectedMode(event.target.value as PublicExamMode)}
                className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
              >
                {PUBLIC_EXAM_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode === 'LEVEL' ? 'Daraja bo‘yicha' : 'Yo‘nalish bo‘yicha'}
                  </option>
                ))}
              </select>
            </label>

            {selectedMode === 'LEVEL' ? (
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Daraja
                <select
                  value={selectedLevel}
                  onChange={(event) => setSelectedLevel(event.target.value as CefrLevel)}
                  className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
                >
                  {CEFR_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Yo‘nalish
                <select
                  value={selectedDirection}
                  onChange={(event) => setSelectedDirection(event.target.value as PublicExamDirection)}
                  className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
                >
                  {PUBLIC_EXAM_DIRECTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="text-sm font-semibold text-[var(--app-text)]">
              Test
              <select
                value={selectedTestId || ''}
                onChange={(event) => setSelectedTestId(Number(event.target.value) || null)}
                disabled={loadingCatalog || catalog.length === 0}
                className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none disabled:opacity-50"
              >
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingCatalog ? (
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)]">
              <Loader2 size={16} className="animate-spin" />
              Mavjud testlar yuklanmoqda...
            </div>
          ) : null}

          {catalogError ? (
            <p className="mt-4 text-sm font-semibold text-red-600">{catalogError}</p>
          ) : null}

          {!loadingCatalog && catalog.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-[var(--app-muted)]">
              Bu tanlov uchun e'lon qilingan ochiq test topilmadi.
            </p>
          ) : null}

          {selectedTest ? (
            <div className="mt-5 border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
              <p className="text-sm font-bold text-[var(--app-text)]">{selectedTest.title}</p>
              <p className="mt-1 text-xs font-medium text-[var(--app-muted)]">
                {selectedTest.questionCount || 0} savol · {selectedTest.duration || '-'} daqiqa ·
                O‘tish bali {selectedTest.passingScore ?? 0}%
              </p>
            </div>
          ) : null}

          {setupError ? <p className="mt-4 text-sm font-semibold text-red-600">{setupError}</p> : null}

          <button
            onClick={() => void handleStartExam()}
            disabled={loadingCatalog || catalog.length === 0}
            className="mt-6 inline-flex items-center gap-2 bg-[var(--app-primary)] px-6 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            <PlayCircle size={16} />
            Imtihonni boshlash
          </button>
        </section>
      ) : null}

      {step === 'exam' && test ? (
        <section className="app-card p-5 sm:p-7">
          <h2 className="text-2xl font-black text-[var(--app-text)]">{test.title}</h2>
          {test.description ? (
            <p className="mt-2 text-sm font-medium text-[var(--app-muted)]">{test.description}</p>
          ) : null}
          <p className="mt-2 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">
            {questionCount} savol
          </p>

          <div className="mt-6 space-y-4">
            {(test.questions || []).map((question, index) => {
              const options = normalizeQuestionOptionItems(question.options);
              const key = String(question.id);
              const questionError = questionErrors[key];
              return (
                <div
                  key={question.id}
                  className={`border p-4 transition-colors ${
                    questionError
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">
                    Savol {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{question.questionText}</p>

                  <div className="mt-3 grid gap-2">
                    {options.map((option) => (
                      <label
                        key={`${question.id}-${option.label}`}
                        className="flex cursor-pointer items-center gap-3 border border-[var(--app-border)] px-3 py-2 text-sm font-semibold text-[var(--app-text)]"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.label}
                          checked={String(answers[key] || '') === option.label}
                          onChange={(event) =>
                            updateAnswer(question.id, event.target.value)
                          }
                        />
                        <span className="font-black">{option.label})</span>
                        <span>{option.value}</span>
                      </label>
                    ))}
                  </div>

                  {questionError ? (
                    <div className="mt-4 border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
                      {questionError}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {setupError ? <p className="mt-4 text-sm font-semibold text-red-600">{setupError}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => void handleSubmitExam()}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-[var(--app-primary)] px-6 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Yakunlash
            </button>
            <button
              onClick={resetFlow}
              className="border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-3 text-sm font-black uppercase tracking-widest text-[var(--app-text)]"
            >
              Bekor qilish
            </button>
          </div>
        </section>
      ) : null}

      {step === 'result' && result ? (
        <section className="app-card p-5 sm:p-7">
          <h2 className="text-2xl font-black text-[var(--app-text)]">Natijangiz</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Ball</p>
              <p className="mt-2 text-2xl font-black text-[var(--app-text)]">
                {result.score}/{result.maxScore}
              </p>
            </div>
            <div className="border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Foiz</p>
              <p className="mt-2 text-2xl font-black text-[var(--app-text)]">{Math.round(result.percentage)}%</p>
            </div>
            <div className="border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Taxminiy daraja</p>
              <p className="mt-2 text-2xl font-black text-[var(--app-primary)]">
                {result.estimatedLevel || 'N/A'}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-[var(--app-muted)]">
            {result.passed ? 'Siz imtihondan o‘tdingiz.' : 'Siz imtihondan o‘tmadingiz.'}
            {typeof result.rank === 'number' ? ` Joriy o‘rin: #${result.rank}.` : ''}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={resetFlow}
              className="bg-[var(--app-primary)] px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
            >
              Boshqa imtihon
            </button>
            <Link
              href="/public-rating"
              className="border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-3 text-sm font-black uppercase tracking-widest text-[var(--app-text)]"
            >
              Umumiy reyting
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
