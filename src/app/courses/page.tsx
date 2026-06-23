"use client";

import { useState } from "react";
import {
  BookOpen,
  Eye,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import {
  CEFR_LEVELS,
  createCourse,
  deleteCourse,
  type CefrLevel,
  updateCourse,
} from "@/lib/backend-api";
import { hasRoleCapability } from "@/lib/role-access";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from "@/app/components/ui/PagePrimitives";

const EMPTY_FORM = {
  title: "",
  level: "A1" as CefrLevel,
  description: "",
  isActive: true,
};

export default function CoursesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const canManageCourses = hasRoleCapability(role, "manage_courses");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CefrLevel | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useCourses({ search, level });
  const courses = data.items || [];

  function openCreateModal() {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditModal(course: any) {
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      level: (course.level || "A1") as CefrLevel,
      description: course.description || "",
      isActive: course.isActive ?? true,
    });
    setIsFormOpen(true);
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setMutationError(null);

      if (editingCourse) {
        await updateCourse(editingCourse.id, form);
      } else {
        await createCourse(form);
      }

      setIsFormOpen(false);
      setEditingCourse(null);
      setForm(EMPTY_FORM);
      await refetch();
    } catch (courseError) {
      setMutationError(
        courseError instanceof Error
          ? courseError.message
          : "Kursni saqlab bo'lmadi"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setMutationError(null);
      await deleteCourse(id);
      await refetch();
    } catch (deleteError) {
      setMutationError(
        deleteError instanceof Error
          ? deleteError.message
          : "Kursni o'chirib bo'lmadi"
      );
    }
  }

  return (
    <PageShell
      title="Kurslar"
      subtitle={`Jami: ${data.meta?.total || courses.length} ta`}
      action={
        canManageCourses ? (
          <button
            onClick={openCreateModal}
            className="bg-[var(--app-primary)] p-3 text-white transition-transform active:scale-95"
          >
            <PlusCircle size={20} strokeWidth={2.5} />
          </button>
        ) : undefined
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kurslarni qidirish..."
            className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] py-3.5 pl-11 pr-4 text-sm font-semibold text-[var(--app-text)] transition-all focus:border-[var(--app-primary)] focus:outline-none"
          />
        </div>

        <select
          value={level}
          onChange={(event) => setLevel(event.target.value as CefrLevel | "")}
          className="border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5 text-sm font-semibold text-[var(--app-text)] transition-all focus:border-[var(--app-primary)] focus:outline-none"
        >
          <option value="">Barcha level</option>
          {CEFR_LEVELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {mutationError ? (
        <div className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {mutationError}
        </div>
      ) : null}

      {loading ? (
        <PageLoadingState
          title="Kurslar yuklanmoqda"
          description="Backenddagi kurslar ro'yxati olinmoqda"
        />
      ) : error ? (
        <PageErrorState
          title="Kurslarni olishda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      ) : courses.length === 0 ? (
        <PageEmptyState
          title="Kurslar topilmadi"
          description="Hozircha filterga mos kurs yo'q."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20 xl:grid-cols-2">
          {courses.map((course: any) => (
            <div key={course.id} className="app-card flex flex-col gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
                  <BookOpen size={22} strokeWidth={2.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-extrabold tracking-tight text-[var(--app-text)]">
                    {course.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {course.level}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        course.isActive
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {course.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                {course.description || "Tavsif kiritilmagan."}
              </p>

              <div
                className={`grid gap-2 ${
                  canManageCourses ? "grid-cols-3" : "grid-cols-1"
                }`}
              >
                <button
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-text)] transition-transform active:scale-95"
                >
                  <Eye size={14} />
                  Ochish
                </button>

                {canManageCourses ? (
                  <>
                    <button
                      onClick={() => openEditModal(course)}
                      className="flex items-center justify-center gap-2 rounded-[14px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--app-primary-dark)] active:scale-95"
                    >
                      <Pencil size={14} />
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => void handleDelete(course.id)}
                      className="flex items-center justify-center gap-2 rounded-[14px] bg-red-500 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
                    >
                      <Trash2 size={14} />
                      O'chirish
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--app-primary)]/20 backdrop-blur-md px-4">
          <div className="w-full max-w-lg rounded-[26px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-xl animate-scale-in">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  {editingCourse ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Course DTO maydonlari
                </p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCourse(null);
                }}
                className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)]"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Course title"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />

              <select
                value={form.level}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    level: event.target.value as CefrLevel,
                  }))
                }
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              >
                {CEFR_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Course description"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />

              <label className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-semibold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCourse(null);
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
                  <PlusCircle size={14} />
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
