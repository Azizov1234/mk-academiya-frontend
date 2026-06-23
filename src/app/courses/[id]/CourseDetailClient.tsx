"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Book,
  ChevronLeft,
  ChevronRight,
  Info,
  ListTodo,
  Loader2,
  PlayCircle,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  assignCourseToGroup,
  getCourseById,
  getGroupsByCourse,
  listGroups,
  removeGroupCourse,
} from "@/lib/backend-api";
import { useAuth } from "@/hooks/useAuth";
import { hasRoleCapability } from "@/lib/role-access";

// ── Skeleton primitives ──────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-100 ${className ?? ""}`}
    />
  );
}

function GroupCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-[18px]" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-10 w-10 rounded-2xl" />
    </div>
  );
}

// ── Lesson steps (static, memoised outside component) ───────────────────────
const LESSON_STEPS = [
  {
    icon: PlayCircle,
    title: "Video va Audio darslik",
    desc: "Interaktiv tushuntirishlar",
    color: "text-[#2563eb]",
    bg: "bg-blue-50",
  },
  {
    icon: Book,
    title: "O'qish materiallari",
    desc: "Kitoblar va PDF darsliklar",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: ListTodo,
    title: "Interaktiv vazifalar",
    desc: "Bilimingizni mustahkamlash",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Trophy,
    title: "Final Exam",
    desc: "Sertifikat uchun imtihon",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
] as const;

// ────────────────────────────────────────────────────────────────────────────
export default function CourseDetailClient() {
  const { id } = useParams();
  const { role } = useAuth();
  const router = useRouter();

  // ── Stable primitives ──
  const courseId = useMemo(() => Number(id), [id]);
  const canManageCourseGroups = useMemo(
    () => hasRoleCapability(role, "manage_courses"),
    [role]
  );

  // ── Core course state ──
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  // ── Groups section state (loads independently) ──
  const [courseGroups, setCourseGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [availableGroupsLoading, setAvailableGroupsLoading] = useState(false);
  const availableGroupsFetchedRef = useRef(false);

  // ── Mutation state ──
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // ── Stable fetch functions (used in handlers) ────────────────────────────

  const fetchCourseGroups = useCallback(async () => {
    if (!courseId) return;
    setGroupsLoading(true);
    try {
      const data = await getGroupsByCourse(courseId);
      setCourseGroups(Array.isArray(data) ? data : []);
    } catch {
      setCourseGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, [courseId]);

  const fetchAvailableGroups = useCallback(async () => {
    if (!canManageCourseGroups || availableGroupsFetchedRef.current) return;
    setAvailableGroupsLoading(true);
    try {
      const data = await listGroups();
      setAvailableGroups(Array.isArray(data) ? data : []);
      availableGroupsFetchedRef.current = true;
    } catch {
      setAvailableGroups([]);
    } finally {
      setAvailableGroupsLoading(false);
    }
  }, [canManageCourseGroups]);

  // ── Initial load: course first, then parallel secondary ──────────────────
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    const load = async () => {
      setCourseLoading(true);
      setCourseError(null);

      try {
        const courseData = await getCourseById(courseId);
        if (cancelled) return;
        setCourse(courseData);

        // Keep initial load focused; group picker options are loaded on demand.
        const secondary: Promise<unknown>[] = [
          // Course groups always fetched
          getGroupsByCourse(courseId)
            .then((d) => {
              if (!cancelled) setCourseGroups(Array.isArray(d) ? d : []);
            })
            .catch(() => {
              if (!cancelled) setCourseGroups([]);
            })
            .finally(() => {
              if (!cancelled) setGroupsLoading(false);
            }),
        ];

        setAvailableGroupsLoading(false);

        void Promise.allSettled(secondary);
      } catch (err: any) {
        if (!cancelled) {
          setCourseError(
            err?.response?.data?.message ||
              err?.message ||
              "Kurs ma'lumotlarini olishda xatolik"
          );
        }
      } finally {
        if (!cancelled) setCourseLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [courseId, canManageCourseGroups]); // Only stable primitives

  // ── Memoised derived state ────────────────────────────────────────────────

  const assignedGroupIds = useMemo(
    () => new Set(courseGroups.map((item) => item.groupId ?? item.group?.id)),
    [courseGroups]
  );

  const groupOptions = useMemo(
    () => availableGroups.filter((g) => !assignedGroupIds.has(g.id)),
    [availableGroups, assignedGroupIds]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAssignGroup = useCallback(async () => {
    const gid = parseInt(assignGroupId.trim(), 10);
    if (!gid || isNaN(gid)) return;

    setAssignLoading(true);
    setAssignError(null);

    try {
      await assignCourseToGroup(gid, courseId);
      setAssignGroupId("");
      availableGroupsFetchedRef.current = false;
      // Refresh both in parallel
      await Promise.all([fetchCourseGroups(), fetchAvailableGroups()]);
    } catch (err: any) {
      setAssignError(
        err?.response?.data?.message || "Guruh biriktirib bo'lmadi"
      );
    } finally {
      setAssignLoading(false);
    }
  }, [assignGroupId, courseId, fetchCourseGroups, fetchAvailableGroups]);

  const handleRemoveGroup = useCallback(
    async (gcId: number, index: number) => {
      if (!confirm("Bu guruhni kursdan olib tashlamoqchimisiz?")) return;

      try {
        await removeGroupCourse(gcId);
        // Optimistic update — no round-trip
        setCourseGroups((prev) => prev.filter((_, i) => i !== index));
        availableGroupsFetchedRef.current = false;
        // Refresh available list (non-blocking)
        void fetchAvailableGroups();
      } catch (err: any) {
        setAssignError(err?.response?.data?.message || "O'chirib bo'lmadi");
      }
    },
    [fetchAvailableGroups]
  );

  // ── Render: course loading ────────────────────────────────────────────────
  if (courseLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-[#2563eb]" size={40} />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <h1 className="text-xl font-black uppercase tracking-widest text-gray-400">
          {courseError || "Kurs topilmadi"}
        </h1>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#2563eb]"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  // ── Main render (course loaded, groups section loads independently) ────────
  return (
    <div className="pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* ── Hero ── */}
      <div className="relative mb-8 pt-6">
        <button
          onClick={() => router.back()}
          className="absolute left-2 top-6 z-10 rounded-2xl border border-gray-100 bg-white/80 p-3 text-gray-500 shadow-sm backdrop-blur-md transition-all active:scale-90"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>

        <div className="group relative h-64 w-full overflow-hidden rounded-[48px] border border-gray-100 bg-gray-50 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent transition-opacity group-hover:opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Book
              size={80}
              className="transform text-[#2563eb]/20 transition-transform group-hover:scale-110"
              strokeWidth={1}
            />
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="mb-2 flex items-center gap-3 px-2">
              <span className="rounded-full bg-[#2563eb] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#2563eb]/30">
                {course.level || "A1"}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#1d4ed8]">
                Online Kurs
              </span>
            </div>
            <h1 className="px-2 text-3xl font-black leading-tight tracking-tight text-gray-900">
              {course.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Stats (visible immediately) ── */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#2563eb]/30">
          <div className="rounded-2xl bg-blue-50 p-3 text-[#2563eb]">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
              Vazifalar
            </p>
            <p className="mt-1 text-sm font-black leading-none text-gray-900">
              {(course._count?.tasks || 0) + (course._count?.tests || 0)} ta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#2563eb]/30">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
            <Users size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
              Guruhlar
            </p>
            <p className="mt-1 text-sm font-black leading-none text-gray-900">
              {groupsLoading ? (
                <Skeleton className="mt-1 h-4 w-8 rounded-lg" />
              ) : (
                `${courseGroups.length} ta`
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10 px-2">
        {/* ── Description ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
              KURS HAQIDA
            </h2>
            <Info size={16} className="text-gray-200" />
          </div>
          <p className="text-justify text-sm font-bold leading-relaxed text-gray-500">
            {course.description ||
              "Ushbu kurs ingliz tilini tizimli o'rganish uchun mo'ljallangan bo'lib, unda barcha ko'nikmalar (Grammar, Vocabulary, Reading) qamrab olingan. Har bir dars oxirida interaktiv testlar mavjud."}
          </p>
        </section>

        {/* ── Lesson steps (static — no loading needed) ── */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
              DARS JARAYONI
            </h2>
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-[#2563eb]">
              4 qism
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {LESSON_STEPS.map((item, idx) => (
              <div
                key={idx}
                className="group flex cursor-pointer items-center gap-5 rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm shadow-blue-900/5 transition-all hover:bg-gray-50"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all group-hover:rotate-6 group-hover:scale-95 ${item.bg} ${item.color}`}
                >
                  <item.icon size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-extrabold leading-none tracking-tight text-[#111827]">
                    {item.title}
                  </h4>
                  <p className="text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">
                    {item.desc}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-200 transition-colors group-hover:text-[#2563eb]"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Course groups (loads independently) ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
              KURS GURUHLARI
              {groupsLoading && (
                <Loader2 size={12} className="ml-2 inline animate-spin" />
              )}
            </h2>
            {!groupsLoading && (
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-500">
                {courseGroups.length} ta
              </span>
            )}
          </div>

          {/* Assign group row (admin only) */}
          {canManageCourseGroups && (
            <div className="mb-4 flex gap-2">
              {availableGroupsLoading ? (
                <div className="h-[52px] flex-1 animate-pulse rounded-[18px] bg-gray-100" />
              ) : (
                <select
                  value={assignGroupId}
                  onFocus={() => void fetchAvailableGroups()}
                  onChange={(e) => setAssignGroupId(e.target.value)}
                  className="flex-1 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[#2563eb]"
                >
                  <option value="">Guruh tanlang...</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} #{group.id}
                    </option>
                  ))}
                </select>
              )}

              <button
                disabled={assignLoading || !assignGroupId}
                onClick={() => void handleAssignGroup()}
                className="shrink-0 rounded-[18px] bg-[#2563eb] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {assignLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "+ Biriktir"
                )}
              </button>
            </div>
          )}

          {assignError && (
            <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              {assignError}
            </div>
          )}

          {/* Groups list with skeleton */}
          {groupsLoading ? (
            <div className="flex flex-col gap-3">
              <GroupCardSkeleton />
              <GroupCardSkeleton />
              <GroupCardSkeleton />
            </div>
          ) : courseGroups.length === 0 ? (
            <div className="rounded-[40px] border border-dashed border-gray-100 bg-gradient-to-br from-[#eff6ff] via-[#f8fbff] to-white p-10 text-center">
              <h3 className="mb-2 text-xl font-black leading-tight tracking-tight text-gray-800">
                Guruhlar mavjud emas
              </h3>
              <p className="mx-auto max-w-[200px] text-sm font-bold text-gray-400">
                Hozircha bu kursga hech qanday guruh biriktirilmagan.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courseGroups.map((gCourse: any, index: number) => {
                const group = gCourse.group;
                return (
                  <div
                    key={gCourse.id ?? index}
                    className="group flex items-center justify-between rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm shadow-blue-900/5 transition-all hover:border-[#2563eb]/20"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-blue-50 text-lg font-black text-[var(--app-primary)] transition-transform group-hover:scale-110">
                        {group?.name?.charAt(0) || "G"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-extrabold leading-none tracking-tight text-[#111827]">
                          {group?.name || "Noma'lum guruh"}
                        </h4>
                        <p className="mt-1 text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">
                          {group?.inviteCode || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {canManageCourseGroups && (
                        <button
                          onClick={() =>
                            void handleRemoveGroup(gCourse.id, index)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90"
                          title="Kursdan olib tashlash"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/groups/${group?.id}`)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-all group-hover:bg-[#2563eb] group-hover:text-white active:scale-95"
                      >
                        <ChevronRight size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
