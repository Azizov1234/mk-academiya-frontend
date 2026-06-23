"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import { useTests } from "@/hooks/useTests";
import {
  CEFR_LEVELS,
  PUBLIC_EXAM_DIRECTIONS,
  PUBLIC_EXAM_MODES,
  createQuestion,
  createTest,
  deleteQuestion,
  deleteTest,
  normalizeQuestionOptionItems,
  type CefrLevel,
  type PublicExamDirection,
  type PublicExamMode,
  type QuestionOption,
  type TestItem,
  type TestPayload,
  type TestQuestionPayload,
  updateQuestion,
  updateTest,
  validateTestPayload,
} from "@/lib/backend-api";
import { hasRoleCapability } from "@/lib/role-access";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from "@/app/components/ui/PagePrimitives";

type QuestionDraft = {
  id?: number;
  type: string;
  inputType: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  points: string;
  difficulty: string;
  skill: string;
};

type TestFormState = {
  title: string;
  description: string;
  type: string;
  cefrLevel: CefrLevel | "";
  duration: string;
  passingScore: string;
  courseId: string;
  shuffleQuestions: boolean;
  maxAttempts: string;
  isAdaptive: boolean;
  isPublished: boolean;
  isPublicExam: boolean;
  publicExamType: PublicExamMode | "";
  publicExamDirection: PublicExamDirection | "";
  questions: QuestionDraft[];
};

const EMPTY_QUESTION: QuestionDraft = {
  type: "MCQ",
  inputType: "OPTIONS",
  questionText: "",
  options: [
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ],
  correctAnswer: "",
  explanation: "",
  points: "1",
  difficulty: "1",
  skill: "GRAMMAR",
};

const EMPTY_FORM: TestFormState = {
  title: "",
  description: "",
  type: "PRACTICE",
  cefrLevel: "",
  duration: "30",
  passingScore: "70",
  courseId: "",
  shuffleQuestions: false,
  maxAttempts: "3",
  isAdaptive: false,
  isPublished: true,
  isPublicExam: false,
  publicExamType: "",
  publicExamDirection: "",
  questions: [],
};

function cloneQuestionDraft(
  question: QuestionDraft = EMPTY_QUESTION
): QuestionDraft {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

function nextOptionLabel(options: QuestionOption[]) {
  const used = new Set(options.map((option) => option.label.toUpperCase()));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return (
    alphabet.split("").find((letter) => !used.has(letter)) ||
    String((options.length + 1) % 10)
  );
}

function normalizeCorrectAnswerToLabel(
  rawAnswer: unknown,
  options: QuestionOption[]
) {
  const answer = String(rawAnswer ?? "").trim();
  if (!answer) return "";

  const byLabel = options.find(
    (option) => option.label.toUpperCase() === answer.toUpperCase()
  );
  if (byLabel) return byLabel.label;

  const normalizedAnswer = answer.toLowerCase();
  const byValue = options.find(
    (option) => option.value.trim().toLowerCase() === normalizedAnswer
  );
  if (byValue) return byValue.label;

  const parsed = answer.match(/^([A-Za-z0-9])\s*[\).:-]?/);
  return parsed ? parsed[1].toUpperCase() : answer.slice(0, 1).toUpperCase();
}

function toQuestionPayload(question: QuestionDraft): TestQuestionPayload {
  const options = question.options
    .map((option) => ({
      label: option.label.trim().slice(0, 1).toUpperCase(),
      value: option.value.trim(),
    }))
    .filter((option) => option.label && option.value);

  return {
    type: question.type.trim() || "MCQ",
    inputType: question.inputType.trim() || "OPTIONS",
    questionText: question.questionText.trim(),
    options,
    correctAnswer: question.correctAnswer.trim(),
    explanation: question.explanation.trim() || undefined,
    points: Number(question.points || 1),
    difficulty: Number(question.difficulty || 1),
    skill: question.skill.trim() || undefined,
  };
}

function toTestPayload(form: TestFormState): TestPayload {
  const courseId = Number(form.courseId);
  const maxAttempts = Number(form.maxAttempts);

  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    type: form.type.trim() || "PRACTICE",
    cefrLevel: form.cefrLevel,
    duration: Number(form.duration || 0),
    timeLimitMinutes: Number(form.duration || 0),
    passingScore: Number(form.passingScore || 0),
    courseId: Number.isFinite(courseId) && courseId > 0 ? courseId : null,
    shuffleQuestions: form.shuffleQuestions,
    maxAttempts:
      Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : null,
    isAdaptive: form.isAdaptive,
    isPublished: form.isPublished,
    isPublicExam: form.isPublicExam,
    publicExamType: form.isPublicExam ? form.publicExamType : "",
    publicExamDirection:
      form.isPublicExam && form.publicExamType === "TRACK"
        ? form.publicExamDirection
        : "",
    questions: form.questions.map(toQuestionPayload),
  };
}

function toFormState(test: TestItem): TestFormState {
  const duration =
    test.timeLimitMinutes ?? test.timeLimit ?? test.duration ?? 30;

  return {
    title: test.title || "",
    description: test.description || "",
    type: test.type || "PRACTICE",
    cefrLevel: (test.cefrLevel || "") as CefrLevel | "",
    duration: String(duration),
    passingScore: String(test.passingScore ?? 70),
    courseId: test.courseId ? String(test.courseId) : "",
    shuffleQuestions: Boolean(test.shuffleQuestions),
    maxAttempts: test.maxAttempts ? String(test.maxAttempts) : "",
    isAdaptive: Boolean(test.isAdaptive),
    isPublished: Boolean(test.isPublished),
    isPublicExam: Boolean(test.isPublicExam),
    publicExamType: (test.publicExamType as PublicExamMode | "") || "",
    publicExamDirection:
      (test.publicExamDirection as PublicExamDirection | "") || "",
    questions:
      test.questions && test.questions.length > 0
        ? test.questions.map((question) => {
            const parsedOptions = normalizeQuestionOptionItems(
              question.options
            );
            const options = parsedOptions.length
              ? parsedOptions
              : cloneQuestionDraft().options;

            return {
              id: question.id,
              type: question.type || "MCQ",
              inputType: question.inputType || "OPTIONS",
              questionText: question.questionText || "",
              options,
              correctAnswer: normalizeCorrectAnswerToLabel(
                question.correctAnswer,
                options
              ),
              explanation: question.explanation || "",
              points: String(question.points || 1),
              difficulty: String(question.difficulty || 1),
              skill: question.skill || "",
            };
          })
        : [cloneQuestionDraft()],
  };
}

function getReadableError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function TestsPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const canManageTests = hasRoleCapability(role, "manage_tests");
  const [search, setSearch] = useState("");
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | "">("");
  const [publishedFilter, setPublishedFilter] = useState<boolean | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [form, setForm] = useState<TestFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      search,
      cefrLevel,
      isPublished: canManageTests ? publishedFilter : true,
      page: 1,
      limit: 50,
    }),
    [canManageTests, cefrLevel, publishedFilter, search]
  );

  const { data, loading, error, refetch } = useTests(query, !authLoading);
  const { data: coursesData } = useCourses(
    { page: 1, limit: 100 },
    canManageTests
  );
  const tests = data.items || [];
  const courses = coursesData.items || [];

  function openCreateModal() {
    setEditingTest(null);
    setForm({ ...EMPTY_FORM, questions: [cloneQuestionDraft()] });
    setMutationError(null);
    setIsFormOpen(true);
  }

  function openEditModal(test: TestItem) {
    setEditingTest(test);
    setForm(toFormState(test));
    setMutationError(null);
    setIsFormOpen(true);
  }

  function updateQuestionDraft(index: number, patch: Partial<QuestionDraft>) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      ),
    }));
  }

  function updateOptionDraft(
    questionIndex: number,
    optionIndex: number,
    patch: Partial<QuestionOption>
  ) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;

        const options = question.options.map((option, currentOptionIndex) =>
          currentOptionIndex === optionIndex
            ? {
                ...option,
                ...patch,
                label:
                  patch.label !== undefined
                    ? patch.label.trim().slice(0, 1).toUpperCase()
                    : option.label,
              }
            : option
        );

        return {
          ...question,
          options,
          correctAnswer: options.some(
            (option) => option.label === question.correctAnswer
          )
            ? question.correctAnswer
            : "",
        };
      }),
    }));
  }

  function addOptionDraft(questionIndex: number) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options: [
                ...question.options,
                { label: nextOptionLabel(question.options), value: "" },
              ],
            }
          : question
      ),
    }));
  }

  function removeOptionDraft(questionIndex: number, optionIndex: number) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;

        const removedLabel = question.options[optionIndex]?.label;
        const options = question.options.filter(
          (_, currentOptionIndex) => currentOptionIndex !== optionIndex
        );

        return {
          ...question,
          options,
          correctAnswer:
            question.correctAnswer === removedLabel
              ? ""
              : question.correctAnswer,
        };
      }),
    }));
  }

  function addQuestionDraft() {
    setForm((current) => ({
      ...current,
      questions: [...current.questions, cloneQuestionDraft()],
    }));
  }

  function removeQuestionDraft(index: number) {
    setForm((current) => ({
      ...current,
      questions: current.questions.filter(
        (_, questionIndex) => questionIndex !== index
      ),
    }));
  }

  async function syncQuestions(
    testId: number,
    original: TestItem,
    drafts: QuestionDraft[]
  ) {
    const keptIds = new Set(
      drafts.map((question) => question.id).filter(Boolean)
    );
    const removedQuestions = (original.questions || []).filter(
      (question) => !keptIds.has(question.id)
    );

    for (const question of removedQuestions) {
      await deleteQuestion(question.id);
    }

    for (const draft of drafts) {
      const payload = toQuestionPayload(draft);
      if (draft.id) {
        await updateQuestion(draft.id, payload);
      } else {
        await createQuestion(testId, payload);
      }
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setMutationError(null);

      const payload = toTestPayload(form);
      const errors = validateTestPayload(payload);
      if (!payload.questions?.length)
        errors.push("Kamida bitta savol kiritilishi kerak");
      if (errors.length) {
        setMutationError(errors.join("\n"));
        return;
      }

      if (editingTest) {
        const { questions: _questions, ...testFields } = payload;
        await updateTest(editingTest.id, testFields);
        await syncQuestions(editingTest.id, editingTest, form.questions);
      } else {
        await createTest(payload);
      }

      setIsFormOpen(false);
      setEditingTest(null);
      setForm({ ...EMPTY_FORM, questions: [cloneQuestionDraft()] });
      await refetch();
    } catch (saveError) {
      setMutationError(getReadableError(saveError, "Testni saqlab bo'lmadi"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setMutationError(null);
      await deleteTest(id);
      await refetch();
    } catch (deleteError) {
      setMutationError(
        getReadableError(deleteError, "Testni o'chirib bo'lmadi")
      );
    }
  }

  return (
    <PageShell
      title="Testlar"
      subtitle={`Jami: ${data.meta?.total || tests.length} ta`}
      action={
        canManageTests ? (
          <button
            onClick={openCreateModal}
            className="rounded-[16px] bg-[var(--app-primary)] p-3 text-white shadow-lg shadow-black/10 transition-transform active:scale-95"
          >
            <PlusCircle size={20} strokeWidth={2.5} />
          </button>
        ) : undefined
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_170px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Testlarni qidirish..."
            className="w-full rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] py-3.5 pl-11 pr-4 text-sm font-semibold text-[var(--app-text)] shadow-sm transition-all focus:border-[var(--app-primary)] focus:outline-none"
          />
        </div>

        <select
          value={cefrLevel}
          onChange={(event) =>
            setCefrLevel(event.target.value as CefrLevel | "")
          }
          className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5 text-sm font-semibold text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none"
        >
          <option value="">Barcha level</option>
          {CEFR_LEVELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {canManageTests ? (
          <select
            value={publishedFilter === "" ? "" : String(publishedFilter)}
            onChange={(event) =>
              setPublishedFilter(
                event.target.value === "" ? "" : event.target.value === "true"
              )
            }
            className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5 text-sm font-semibold text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none"
          >
            <option value="">Barcha holat</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>

      {mutationError ? (
        <div className="mb-4 whitespace-pre-line rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {mutationError}
        </div>
      ) : null}

      {loading ? (
        <PageLoadingState
          title="Testlar yuklanmoqda"
          description="Backenddagi testlar ro'yxati olinmoqda"
        />
      ) : error ? (
        <PageErrorState
          title="Testlarni olishda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      ) : tests.length === 0 ? (
        <PageEmptyState
          title="Testlar topilmadi"
          description="Hozircha sizga tegishli testlar mavjud emas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20 xl:grid-cols-2">
          {tests.map((test) => {
            const questionCount =
              test._count?.questions ?? test.questions?.length ?? 0;
            const duration =
              test.timeLimitMinutes ?? test.timeLimit ?? test.duration ?? 0;

            return (
              <div key={test.id} className="app-card flex flex-col gap-4 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
                    <ClipboardCheck size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-extrabold tracking-tight text-[var(--app-text)]">
                      {test.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--app-muted)]">
                      {test.description || "Tavsif kiritilmagan."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-[var(--app-surface-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    {test.type || "PRACTICE"}
                  </span>
                  {test.cefrLevel ? (
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-blue-700">
                      {test.cefrLevel}
                    </span>
                  ) : null}
                  {test.isPublicExam ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                      PUBLIC
                    </span>
                  ) : null}
                  {test.publicExamType ? (
                    <span className="rounded-md bg-indigo-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-700">
                      {test.publicExamType}
                    </span>
                  ) : null}
                  {test.publicExamDirection ? (
                    <span className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-violet-700">
                      {test.publicExamDirection}
                    </span>
                  ) : null}
                  <span className="rounded-md bg-[var(--app-surface-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    {questionCount} savol
                  </span>
                  <span className="rounded-md bg-[var(--app-surface-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    {duration || "-"} daqiqa
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                      test.isPublished
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {test.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div
                  className={`grid gap-2 ${
                    canManageTests ? "grid-cols-3" : "grid-cols-1"
                  }`}
                >
                  <button
                    onClick={() => router.push(`/tests/${test.id}`)}
                    className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-text)] transition-transform active:scale-95"
                  >
                    <Eye size={14} />
                    Ochish
                  </button>

                  {canManageTests ? (
                    <>
                      <button
                        onClick={() => openEditModal(test)}
                        className="flex items-center justify-center gap-2 rounded-[14px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--app-primary-dark)] active:scale-95"
                      >
                        <Pencil size={14} />
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => void handleDelete(test.id)}
                        className="flex items-center justify-center gap-2 rounded-[14px] bg-red-500 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
                      >
                        <Trash2 size={14} />
                        O'chirish
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-[var(--app-primary)]/20 backdrop-blur-md px-3 py-6 sm:px-4">
          <div className="mx-auto w-full max-w-4xl rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-xl animate-scale-in sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  {editingTest ? "Testni tahrirlash" : "Yangi test yaratish"}
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Test va savollar backend validatsiyasiga mos tekshiriladi
                </p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingTest(null);
                }}
                className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)]"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Test nomi"
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <input
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                placeholder="PRACTICE / EXAM"
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <select
                value={form.publicExamType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publicExamType: event.target.value as PublicExamMode | "",
                    publicExamDirection:
                      event.target.value === "TRACK"
                        ? current.publicExamDirection
                        : "",
                  }))
                }
                disabled={!form.isPublicExam}
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                <option value="">Public mode tanlanmagan</option>
                {PUBLIC_EXAM_MODES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.cefrLevel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cefrLevel: event.target.value as CefrLevel | "",
                  }))
                }
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              >
                <option value="">CEFR level</option>
                {CEFR_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.publicExamDirection}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publicExamDirection: event.target.value as
                      | PublicExamDirection
                      | "",
                  }))
                }
                disabled={!form.isPublicExam || form.publicExamType !== "TRACK"}
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                <option value="">Yo'nalish tanlanmagan</option>
                {PUBLIC_EXAM_DIRECTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.courseId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    courseId: event.target.value,
                  }))
                }
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              >
                <option value="">Kurs tanlanmagan</option>
                {courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    duration: event.target.value,
                  }))
                }
                placeholder="Davomiylik, daqiqa"
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={form.passingScore}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    passingScore: event.target.value,
                  }))
                }
                placeholder="O'tish foizi"
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <input
                type="number"
                min={1}
                value={form.maxAttempts}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxAttempts: event.target.value,
                  }))
                }
                placeholder="Urinishlar soni"
                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Test tavsifi"
                className="min-h-24 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold md:col-span-2"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <label className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={form.isPublicExam}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPublicExam: event.target.checked,
                      publicExamType: event.target.checked
                        ? current.publicExamType
                        : "",
                      publicExamDirection: event.target.checked
                        ? current.publicExamDirection
                        : "",
                    }))
                  }
                />
                Public exam
              </label>
              <label className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPublished: event.target.checked,
                    }))
                  }
                />
                Published
              </label>
              <label className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={form.shuffleQuestions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shuffleQuestions: event.target.checked,
                    }))
                  }
                />
                Shuffle
              </label>
              <label className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={form.isAdaptive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isAdaptive: event.target.checked,
                    }))
                  }
                />
                Adaptive
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--app-muted)]">
                Savollar
              </h4>
              <button
                onClick={addQuestionDraft}
                className="rounded-[14px] bg-[var(--app-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
              >
                Savol qo'shish
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {form.questions.map((question, index) => (
                <div
                  key={`${question.id || "new"}-${index}`}
                  className="rounded-[18px] border border-[var(--app-border)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[var(--app-text)]">
                      {index + 1}-savol
                    </p>
                    <button
                      onClick={() => removeQuestionDraft(index)}
                      disabled={form.questions.length === 1}
                      className="rounded-[12px] bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 disabled:opacity-40"
                    >
                      O'chirish
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <textarea
                      value={question.questionText}
                      onChange={(event) =>
                        updateQuestionDraft(index, {
                          questionText: event.target.value,
                        })
                      }
                      placeholder="Savol matni"
                      className="min-h-24 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold md:col-span-2"
                    />
                    <input
                      value={question.type}
                      onChange={(event) =>
                        updateQuestionDraft(index, { type: event.target.value })
                      }
                      placeholder="MCQ"
                      className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                    />
                    <input
                      value={question.inputType}
                      onChange={(event) =>
                        updateQuestionDraft(index, {
                          inputType: event.target.value,
                        })
                      }
                      placeholder="OPTIONS"
                      className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                    />
                    <div className="space-y-3 rounded-[16px] border border-[var(--app-border)] p-3 md:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                          Variantlar
                        </p>
                        <button
                          onClick={() => addOptionDraft(index)}
                          className="rounded-[12px] bg-[var(--app-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                        >
                          Variant qo'shish
                        </button>
                      </div>

                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={`${option.label}-${optionIndex}`}
                            className="grid grid-cols-[64px_1fr_auto] gap-2"
                          >
                            <input
                              value={option.label}
                              maxLength={1}
                              onChange={(event) =>
                                updateOptionDraft(index, optionIndex, {
                                  label: event.target.value,
                                })
                              }
                              placeholder="A"
                              className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 text-center text-sm font-black uppercase"
                            />
                            <input
                              value={option.value}
                              onChange={(event) =>
                                updateOptionDraft(index, optionIndex, {
                                  value: event.target.value,
                                })
                              }
                              placeholder={`${
                                option.label || "A"
                              }) Variant qiymati`}
                              className="min-w-0 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                            />
                            <button
                              onClick={() =>
                                removeOptionDraft(index, optionIndex)
                              }
                              disabled={question.options.length <= 2}
                              className="rounded-[12px] bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 disabled:opacity-40"
                            >
                              Olib tashlash
                            </button>
                          </div>
                        ))}
                      </div>

                      <select
                        value={question.correctAnswer}
                        onChange={(event) =>
                          updateQuestionDraft(index, {
                            correctAnswer: event.target.value,
                          })
                        }
                        className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                      >
                        <option value="">To'g'ri javobni tanlang</option>
                        {question.options
                          .filter(
                            (option) =>
                              option.label.trim() && option.value.trim()
                          )
                          .map((option) => (
                            <option key={option.label} value={option.label}>
                              {option.label}) {option.value}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <input
                        value={question.skill}
                        onChange={(event) =>
                          updateQuestionDraft(index, {
                            skill: event.target.value,
                          })
                        }
                        placeholder="Skill"
                        className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          min={1}
                          value={question.points}
                          onChange={(event) =>
                            updateQuestionDraft(index, {
                              points: event.target.value,
                            })
                          }
                          placeholder="Ball"
                          className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                        />
                        <input
                          type="number"
                          min={1}
                          value={question.difficulty}
                          onChange={(event) =>
                            updateQuestionDraft(index, {
                              difficulty: event.target.value,
                            })
                          }
                          placeholder="Qiyinlik"
                          className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <textarea
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestionDraft(index, {
                          explanation: event.target.value,
                        })
                      }
                      placeholder="Izoh"
                      className="min-h-20 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold md:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingTest(null);
                }}
                className="flex-1 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-muted)]"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
