"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  addGroupMember,
  assignCourseToGroup,
  createGroupAssignment,
  createTask,
  getCoursesByGroup,
  getGroupById,
  getGroupMembers,
  listCourses,
  listTasks,
  listTests,
  listUsers,
  removeGroupCourse,
  removeGroupMember,
  TASK_TYPES,
} from "@/lib/backend-api";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  Phone,
  PlusCircle,
  RefreshCw,
  Send,
  Square,
  Users,
  UserCircle2,
  UserMinus,
  UserPlus,
} from "lucide-react";

// ── Tiny skeleton primitive ──────────────────────────────────────────────────
function Sk({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--app-surface-soft)] ${className}`}
    />
  );
}
function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Sk key={i} className="h-[72px] w-full" />
      ))}
    </div>
  );
}

// ── Recipient mode type ──────────────────────────────────────────────────────
type RecipientMode = "group" | "select" | "any";
type AssignMode = "test" | "task";
type TaskSubMode = "existing" | "new";

// ────────────────────────────────────────────────────────────────────────────
export default function GroupDetailClient() {
  const router = useRouter();
  const { id } = useParams();
  const { role } = useAuth();

  // ── Stable derived primitives ──
  const groupId = useMemo(() => Number(id), [id]);
  const isAdmin = useMemo(
    () => role === "admin" || role === "superadmin",
    [role]
  );
  const canAnnounce = useMemo(
    () => isAdmin || role === "teacher",
    [isAdmin, role]
  );

  // ── Core group ──
  const [group, setGroup] = useState<any>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);

  // ── Independent section states ──
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);

  const [testOptions, setTestOptions] = useState<any[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);

  const [taskOptions, setTaskOptions] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // ── Mutation feedback ──
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Course assignment ──
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignCourseLoading, setAssignCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // ── Unified announcement panel ──
  const [assignMode, setAssignMode] = useState<AssignMode>("test");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("group");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceError, setAnnounceError] = useState<string | null>(null);
  const [announceSuccess, setAnnounceSuccess] = useState<string | null>(null);

  // test sub-state
  const [assignTestId, setAssignTestId] = useState("");

  // task sub-state
  const [taskSubMode, setTaskSubMode] = useState<TaskSubMode>("existing");
  const [assignTaskId, setAssignTaskId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState("GRAMMAR");
  const [newTaskXp, setNewTaskXp] = useState("10");

  // ── Add-member modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const studentsFetchedRef = useRef(false);
  const courseOptionsFetchedRef = useRef(false);
  const testsFetchedRef = useRef(false);
  const tasksFetchedRef = useRef(false);

  // "Any student" picker (admin announces to students not in group)
  const [anyPickerId, setAnyPickerId] = useState("");

  // ── Stable fetch helpers (used by handlers after initial load) ────────────

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(groupId);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      // non-critical
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  const fetchCourses = useCallback(async () => {
    if (!groupId) return;
    setCoursesLoading(true);
    try {
      const data = await getCoursesByGroup(groupId);
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [groupId]);

  const fetchCourseOptions = useCallback(async () => {
    if (!isAdmin || courseOptionsFetchedRef.current) return;
    setCourseOptionsLoading(true);
    try {
      const data = await listCourses({ limit: 100 });
      setCourseOptions(Array.isArray(data.items) ? data.items : []);
      courseOptionsFetchedRef.current = true;
    } catch {
      setCourseOptions([]);
    } finally {
      setCourseOptionsLoading(false);
    }
  }, [isAdmin]);

  const fetchTestOptions = useCallback(async () => {
    if (!canAnnounce || testsFetchedRef.current) return;
    setTestsLoading(true);
    try {
      const data = await listTests({ page: 1, limit: 100, isActive: true, isPublished: true });
      setTestOptions(Array.isArray(data.items) ? data.items : []);
      testsFetchedRef.current = true;
    } catch {
      setTestOptions([]);
    } finally {
      setTestsLoading(false);
    }
  }, [canAnnounce]);

  const fetchTaskOptions = useCallback(async () => {
    if (!canAnnounce || tasksFetchedRef.current) return;
    setTasksLoading(true);
    try {
      const data = await listTasks();
      setTaskOptions(Array.isArray(data) ? data : []);
      tasksFetchedRef.current = true;
    } catch {
      setTaskOptions([]);
    } finally {
      setTasksLoading(false);
    }
  }, [canAnnounce]);

  const fetchStudentOptions = useCallback(async () => {
    if (studentsFetchedRef.current) return;
    setStudentsLoading(true);
    try {
      const data = await listUsers(
        role,
        { user: "STUDENT", page: 1, limit: 200 },
        "role-specific"
      );
      setStudentOptions(Array.isArray(data) ? data : []);
      studentsFetchedRef.current = true;
    } catch {
      setStudentOptions([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [role]);

  // ── Initial parallel load ────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    const load = async () => {
      setGroupLoading(true);
      setGroupError(null);
      try {
        const groupData = await getGroupById(groupId);
        if (cancelled) return;
        setGroup(groupData);

        if (Array.isArray(groupData?.members) && groupData.members.length > 0) {
          setMembers(groupData.members);
        }

        const isAdminLocal = role === "admin" || role === "superadmin";
        // Initial load keeps only visible group essentials.
        const secondary: Promise<unknown>[] = [
          getCoursesByGroup(groupId)
            .then((d) => {
              if (!cancelled) setCourses(Array.isArray(d) ? d : []);
            })
            .catch(() => {
              if (!cancelled) setCourses([]);
            })
            .finally(() => {
              if (!cancelled) setCoursesLoading(false);
            }),
        ];

        setCourseOptionsLoading(false);
        setTestsLoading(false);
        setTasksLoading(false);

        if (!groupData?.members?.length) {
          secondary.push(
            getGroupMembers(groupId)
              .then((d) => {
                if (!cancelled) setMembers(Array.isArray(d) ? d : []);
              })
              .catch(() => {})
              .finally(() => {
                if (!cancelled) setMembersLoading(false);
              })
          );
        } else {
          setMembersLoading(false);
        }

        void Promise.allSettled(secondary);
      } catch (err: any) {
        if (!cancelled) {
          setGroupError(
            err?.response?.data?.message ||
              err?.message ||
              "Guruh ma'lumotlarini olishda xatolik"
          );
        }
      } finally {
        if (!cancelled) setGroupLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId, role]);

  // ── Load students when modal opens OR "any" mode selected ─────────────────
  useEffect(() => {
    if (
      (showAddModal || recipientMode === "any") &&
      isAdmin &&
      !studentsFetchedRef.current
    ) {
      void fetchStudentOptions();
    }
  }, [showAddModal, recipientMode, isAdmin, fetchStudentOptions]);

  // ── Reset announcement form when switching modes ──────────────────────────
  useEffect(() => {
    setAnnounceError(null);
    setAnnounceSuccess(null);
    setSelectedStudentIds([]);
    setAnyPickerId("");
  }, [assignMode, recipientMode, taskSubMode]);

  // ── Memoised derived state ────────────────────────────────────────────────

  const assignedCourseIds = useMemo(
    () => new Set(courses.map((item) => item.courseId ?? item.course?.id)),
    [courses]
  );

  const courseSelectOptions = useMemo(
    () => courseOptions.filter((c) => !assignedCourseIds.has(c.id)),
    [courseOptions, assignedCourseIds]
  );

  const activeStudentIds = useMemo(
    () => new Set(members.map((m) => m.studentId ?? m.student?.id ?? m.id)),
    [members]
  );

  const studentSelectOptions = useMemo(
    () => studentOptions.filter((s) => !activeStudentIds.has(s.id)),
    [studentOptions, activeStudentIds]
  );

  const memberTargetOptions = useMemo(
    () =>
      members
        .map((member) => {
          const student = member.student ?? member;
          const sid = student?.id ?? member.studentId;
          return {
            id: sid,
            name: student?.fullName ?? student?.full_name ?? `Student #${sid}`,
          };
        })
        .filter((s) => Boolean(s.id)),
    [members]
  );

  // Students not in the group (for "any" admin mode)
  const anyStudentOptions = useMemo(
    () => studentOptions.filter((s) => !activeStudentIds.has(s.id)),
    [studentOptions, activeStudentIds]
  );

  const memberCount = useMemo(
    () => members.length || group?._count?.members || 0,
    [members, group]
  );

  const avatarColors = useMemo(
    () => [
      "from-blue-500 to-blue-400",
      "from-emerald-500 to-teal-400",
      "from-violet-500 to-purple-400",
      "from-amber-500 to-orange-400",
      "from-rose-500 to-pink-400",
    ],
    []
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Toggle a member in selectedStudentIds
  const toggleMember = useCallback((sid: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  }, []);

  const selectAllMembers = useCallback(() => {
    setSelectedStudentIds(memberTargetOptions.map((m) => m.id));
  }, [memberTargetOptions]);

  const clearSelection = useCallback(() => {
    setSelectedStudentIds([]);
  }, []);

  // Add from "any" picker to selectedStudentIds
  const addAnyStudent = useCallback(() => {
    const sid = Number(anyPickerId);
    if (!sid || isNaN(sid)) return;
    if (!selectedStudentIds.includes(sid)) {
      setSelectedStudentIds((prev) => [...prev, sid]);
    }
    setAnyPickerId("");
  }, [anyPickerId, selectedStudentIds]);

  const removeAnyStudent = useCallback((sid: number) => {
    setSelectedStudentIds((prev) => prev.filter((x) => x !== sid));
  }, []);

  // ── Main announce handler ─────────────────────────────────────────────────
  const handleAnnounce = useCallback(async () => {
    setAnnounceError(null);
    setAnnounceSuccess(null);

    // --- resolve entity ---
    let entityPayload: { testId?: number; taskId?: number } = {};

    if (assignMode === "test") {
      const tid = Number(assignTestId);
      if (!tid) {
        setAnnounceError("Test tanlang");
        return;
      }
      entityPayload = { testId: tid };
    } else {
      if (taskSubMode === "existing") {
        const tid = Number(assignTaskId);
        if (!tid) {
          setAnnounceError("Task tanlang");
          return;
        }
        entityPayload = { taskId: tid };
      } else {
        if (!newTaskTitle.trim()) {
          setAnnounceError("Vazifa nomi kiriting");
          return;
        }
        const xp = Number(newTaskXp);
        if (!xp || isNaN(xp) || xp < 1) {
          setAnnounceError("XP miqdorini kiriting (min 1)");
          return;
        }
        try {
          const newTask = await createTask({
            title: newTaskTitle.trim(),
            type: newTaskType as any,
            xpReward: xp,
          });
          const taskId = newTask?.id ?? newTask?.data?.id;
          if (!taskId) throw new Error("Task yaratilmadi");
          entityPayload = { taskId };
        } catch (err: any) {
          setAnnounceError(
            err?.response?.data?.message ||
              err?.message ||
              "Task yaratib bo'lmadi"
          );
          return;
        }
      }
    }

    // --- resolve recipients ---
    let studentIds: (number | null)[];

    if (recipientMode === "group") {
      studentIds = [null]; // whole group
    } else {
      if (selectedStudentIds.length === 0) {
        setAnnounceError("Kamida 1 ta talaba tanlang");
        return;
      }
      studentIds = selectedStudentIds;
    }

    setAnnounceLoading(true);

    try {
      const dueDate = assignDueDate
        ? new Date(assignDueDate).toISOString()
        : null;

      const results = await Promise.allSettled(
        studentIds.map((sid) =>
          createGroupAssignment({
            groupId,
            studentId: sid,
            dueDate,
            isRequired: true,
            ...entityPayload,
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length === results.length) {
        const firstErr = (failed[0] as PromiseRejectedResult).reason;
        setAnnounceError(
          firstErr?.response?.data?.message ||
            firstErr?.message ||
            "E'lon qilib bo'lmadi"
        );
        return;
      }

      // Reset form
      setAssignTestId("");
      setAssignTaskId("");
      setNewTaskTitle("");
      setNewTaskXp("10");
      setSelectedStudentIds([]);
      setAnyPickerId("");
      setAssignDueDate("");

      const label = assignMode === "test" ? "Test" : "Vazifa";
      const count = studentIds.length;
      setAnnounceSuccess(
        failed.length > 0
          ? `${label} e'lon qilindi (${
              results.length - failed.length
            }/${count} ta muvaffaqiyatli)`
          : recipientMode === "group"
          ? `${label} butun guruhga muvaffaqiyatli e'lon qilindi`
          : `${label} ${count} ta talabaga muvaffaqiyatli e'lon qilindi`
      );
    } catch (err: any) {
      setAnnounceError(
        err?.response?.data?.message || err?.message || "E'lon qilib bo'lmadi"
      );
    } finally {
      setAnnounceLoading(false);
    }
  }, [
    assignMode,
    assignTestId,
    taskSubMode,
    assignTaskId,
    newTaskTitle,
    newTaskType,
    newTaskXp,
    recipientMode,
    selectedStudentIds,
    groupId,
    assignDueDate,
  ]);

  // ── Course handlers ───────────────────────────────────────────────────────
  const handleAssignCourse = useCallback(async () => {
    const courseId = Number(assignCourseId);
    if (!courseId || Number.isNaN(courseId)) {
      setCourseError("Kurs tanlang");
      return;
    }
    setAssignCourseLoading(true);
    setCourseError(null);
    try {
      await assignCourseToGroup(groupId, courseId);
      setAssignCourseId("");
      courseOptionsFetchedRef.current = false;
      await Promise.all([fetchCourses(), fetchCourseOptions()]);
    } catch (err: any) {
      setCourseError(
        err?.response?.data?.message || "Kursni guruhga biriktirib bo'lmadi"
      );
    } finally {
      setAssignCourseLoading(false);
    }
  }, [assignCourseId, groupId, fetchCourses, fetchCourseOptions]);

  const handleRemoveCourse = useCallback(
    async (gcId: number, idx: number) => {
      if (!confirm("Bu kursni guruhdan olib tashlamoqchimisiz?")) return;
      try {
        await removeGroupCourse(gcId);
        setCourses((prev) => prev.filter((_, i) => i !== idx));
        courseOptionsFetchedRef.current = false;
        void fetchCourseOptions();
      } catch (err: any) {
        setActionError(err?.response?.data?.message || "O'chirib bo'lmadi");
      }
    },
    [fetchCourseOptions]
  );

  // ── Member handlers ───────────────────────────────────────────────────────
  const handleAddMember = useCallback(async () => {
    const sid = parseInt(studentIdInput.trim(), 10);
    if (!sid || isNaN(sid)) {
      setActionError("To'g'ri student ID kiriting");
      return;
    }
    setAddLoading(true);
    setActionError(null);
    try {
      await addGroupMember(groupId, sid);
      setShowAddModal(false);
      setStudentIdInput("");
      studentsFetchedRef.current = false;
      await Promise.all([fetchMembers(), fetchStudentOptions()]);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || "O'quvchini qo'shib bo'lmadi"
      );
    } finally {
      setAddLoading(false);
    }
  }, [studentIdInput, groupId, fetchMembers, fetchStudentOptions]);

  const handleRemoveMember = useCallback(
    async (studentId: number, name: string) => {
      if (!confirm(`"${name}" ni guruhdan chiqarishni tasdiqlaysizmi?`)) return;
      setActionError(null);
      try {
        await removeGroupMember(groupId, studentId);
        setMembers((prev) =>
          prev.filter(
            (m) => m.studentId !== studentId && m.student?.id !== studentId
          )
        );
      } catch (err: any) {
        setActionError(
          err?.response?.data?.message || "O'quvchini chiqarib bo'lmadi"
        );
      }
    },
    [groupId]
  );

  // ── Loading / error states ────────────────────────────────────────────────
  if (groupLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[var(--app-primary)]" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="rounded-[24px] bg-red-50 p-5 text-red-400">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-base font-black text-[var(--app-text)]">
          Xatolik yuz berdi
        </h2>
        <p className="max-w-xs text-sm font-bold text-[var(--app-muted)]">
          {groupError || "Guruh topilmadi"}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 rounded-2xl bg-[var(--app-primary)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  // ── Helper: Recipient selector UI ─────────────────────────────────────────
  const RecipientSelector = (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        Kim uchun
      </p>

      {/* Mode radio tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: "group" as RecipientMode, label: "Butun guruh" },
            { val: "select" as RecipientMode, label: "A'zolardan tanlash" },
            ...(isAdmin
              ? [{ val: "any" as RecipientMode, label: "Istalgan talaba" }]
              : []),
          ] as { val: RecipientMode; label: string }[]
        ).map(({ val, label }) => (
          <button
            key={val}
            type="button"
            onClick={() => setRecipientMode(val)}
            className={`rounded-[14px] border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              recipientMode === val
                ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:border-[var(--app-primary)]/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Select from group members */}
      {recipientMode === "select" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--app-muted)]">
              {selectedStudentIds.length} ta tanlandi
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllMembers}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)] hover:opacity-70"
              >
                Barchasi
              </button>
              <span className="text-[var(--app-muted)]">/</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:opacity-70"
              >
                Bekor
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)]">
            {membersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2
                  size={16}
                  className="animate-spin text-[var(--app-muted)]"
                />
              </div>
            ) : memberTargetOptions.length === 0 ? (
              <p className="py-4 text-center text-xs font-bold text-[var(--app-muted)]">
                A'zolar yo'q
              </p>
            ) : (
              memberTargetOptions.map((m) => {
                const checked = selectedStudentIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-soft)]"
                  >
                    {checked ? (
                      <CheckSquare
                        size={16}
                        className="shrink-0 text-[var(--app-primary)]"
                      />
                    ) : (
                      <Square
                        size={16}
                        className="shrink-0 text-[var(--app-muted)]"
                      />
                    )}
                    <span className="truncate">{m.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-[var(--app-muted)]">
                      #{m.id}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Any student (admin) */}
      {recipientMode === "any" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {studentsLoading ? (
              <Sk className="h-[46px] flex-1" />
            ) : (
              <select
                value={anyPickerId}
                onChange={(e) => setAnyPickerId(e.target.value)}
                className="flex-1 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm font-bold text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
              >
                <option value="">Talaba qidirish...</option>
                {anyStudentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} #{s.id}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={addAnyStudent}
              disabled={!anyPickerId}
              className="rounded-[14px] bg-[var(--app-primary)] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50"
            >
              Qo'sh
            </button>
          </div>
          {selectedStudentIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedStudentIds.map((sid) => {
                const student = studentOptions.find((s) => s.id === sid);
                return (
                  <span
                    key={sid}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--app-primary)]/10 px-3 py-1 text-[10px] font-black text-[var(--app-primary)]"
                  >
                    {student?.fullName ?? `#${sid}`}
                    <button
                      type="button"
                      onClick={() => removeAnyStudent(sid)}
                      className="ml-0.5 text-[var(--app-primary)] hover:text-red-500"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <p className="text-[10px] font-bold text-[var(--app-muted)]">
            {selectedStudentIds.length} ta talaba tanlandi
          </p>
        </div>
      )}
    </div>
  );

  // ── Due date field ────────────────────────────────────────────────────────
  const DueDateField = (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        Muddat (ixtiyoriy)
      </label>
      <input
        type="datetime-local"
        value={assignDueDate}
        onChange={(e) => setAssignDueDate(e.target.value)}
        className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[var(--app-primary)]"
      />
    </div>
  );

  // ── Announce button ───────────────────────────────────────────────────────
  const AnnounceButton = (
    <button
      type="button"
      onClick={() => void handleAnnounce()}
      disabled={announceLoading}
      className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[var(--app-primary-dark)] active:scale-95 disabled:opacity-60"
    >
      {announceLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Send size={14} />
      )}
      {assignMode === "test" ? "Testni e'lon qilish" : "Vazifani e'lon qilish"}
    </button>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[var(--app-bg)]/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="app-touch shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-sm transition-all active:scale-90"
          >
            <ChevronLeft size={20} className="text-[var(--app-text)]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black uppercase tracking-tight text-[var(--app-text)]">
              {group.name}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
              {membersLoading ? "..." : `${memberCount} o'quvchi`}
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-[var(--app-primary)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]">
            {group.inviteCode}
          </span>
        </div>
      </div>

      <div className="space-y-8 px-4 py-6 sm:px-6">
        {/* ── Global action error ── */}
        {actionError && (
          <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {actionError}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="app-card flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-blue-50 p-3 text-[#2563eb]">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                O'quvchilar
              </p>
              <p className="text-2xl font-black tracking-tighter text-[var(--app-text)]">
                {memberCount}
              </p>
            </div>
          </div>
          <div className="app-card flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                O'qituvchi
              </p>
              <p className="text-sm font-black leading-tight tracking-tight text-[var(--app-text)]">
                {group.teacher?.fullName?.split(" ")[0] || "Noma'lum"}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            UNIFIED ANNOUNCE PANEL (test + task)
        ══════════════════════════════════════════════════════════════════ */}
        {canAnnounce && (
          <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
            {/* Panel header with mode tabs */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] bg-amber-50 p-3 text-amber-500">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    E'LON QILISH
                  </p>
                  <p className="text-sm font-black text-[var(--app-text)]">
                    Test yoki vazifani guruhga biriktirish
                  </p>
                </div>
              </div>
              {/* Mode switcher */}
              <div className="flex overflow-hidden rounded-[14px] border border-[var(--app-border)]">
                <button
                  type="button"
                  onClick={() => setAssignMode("test")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    assignMode === "test"
                      ? "bg-[var(--app-primary)] text-white"
                      : "bg-[var(--app-surface)] text-[var(--app-muted)] hover:bg-[var(--app-surface-soft)]"
                  }`}
                >
                  <FileText size={12} />
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode("task")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    assignMode === "task"
                      ? "bg-[var(--app-primary)] text-white"
                      : "bg-[var(--app-surface)] text-[var(--app-muted)] hover:bg-[var(--app-surface-soft)]"
                  }`}
                >
                  <ClipboardList size={12} />
                  Vazifa
                </button>
              </div>
            </div>

            {/* Feedback */}
            {announceError && (
              <div className="mb-4 rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                {announceError}
              </div>
            )}
            {announceSuccess && (
              <div className="mb-4 rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                {announceSuccess}
              </div>
            )}

            <div className="space-y-4">
              {/* ── TEST MODE ── */}
              {assignMode === "test" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    Test tanlang
                  </label>
                  {testsLoading ? (
                    <Sk className="h-[46px] w-full" />
                  ) : (
                      <select
                        value={assignTestId}
                        onFocus={() => void fetchTestOptions()}
                        onChange={(e) => setAssignTestId(e.target.value)}
                      className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[var(--app-primary)]"
                    >
                      <option value="">Test tanlang...</option>
                      {testOptions.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.title} #{test.id}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push("/tests")}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)] hover:opacity-70"
                    >
                      + Yangi test yaratish
                    </button>
                  </div>
                </div>
              )}

              {/* ── TASK MODE ── */}
              {assignMode === "task" && (
                <div className="space-y-3">
                  {/* Task sub-mode */}
                  <div className="flex overflow-hidden rounded-[14px] border border-[var(--app-border)]">
                    <button
                      type="button"
                      onClick={() => setTaskSubMode("existing")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        taskSubMode === "existing"
                          ? "bg-[var(--app-primary)]/10 text-[var(--app-primary)]"
                          : "bg-[var(--app-surface)] text-[var(--app-muted)]"
                      }`}
                    >
                      Mavjud task
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskSubMode("new")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        taskSubMode === "new"
                          ? "bg-[var(--app-primary)]/10 text-[var(--app-primary)]"
                          : "bg-[var(--app-surface)] text-[var(--app-muted)]"
                      }`}
                    >
                      Yangi task
                    </button>
                  </div>

                  {taskSubMode === "existing" ? (
                    <div className="space-y-1">
                      {tasksLoading ? (
                        <Sk className="h-[46px] w-full" />
                      ) : (
                        <select
                          value={assignTaskId}
                          onFocus={() => void fetchTaskOptions()}
                          onChange={(e) => setAssignTaskId(e.target.value)}
                          className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[var(--app-primary)]"
                        >
                          <option value="">Task tanlang...</option>
                          {taskOptions.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.title} #{task.id}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    /* Inline new task form */
                    <div className="space-y-3 rounded-[16px] border border-dashed border-[var(--app-border)] p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                        Yangi vazifa
                      </p>
                      <input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Vazifa nomi..."
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[var(--app-primary)]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                            Turi
                          </label>
                          <select
                            value={newTaskType}
                            onChange={(e) => setNewTaskType(e.target.value)}
                            className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm font-bold text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
                          >
                            {TASK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                            XP mukofot
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={newTaskXp}
                            onChange={(e) => setNewTaskXp(e.target.value)}
                            className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm font-bold text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Shared: recipient + dueDate + button ── */}
              {RecipientSelector}
              {DueDateField}
              {AnnounceButton}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            KURSLAR
        ══════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)]">
              <BookOpen size={14} className="text-[var(--app-primary)]" />
              Kurslar
              {coursesLoading && <Loader2 size={12} className="animate-spin" />}
            </h2>
            {!coursesLoading && (
              <span className="rounded-xl bg-[var(--app-surface-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]">
                {courses.length} ta
              </span>
            )}
          </div>

          {/* Course assign row */}
          {isAdmin && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              {courseOptionsLoading ? (
                <Sk className="h-[52px] flex-1" />
              ) : (
                <select
                  value={assignCourseId}
                  onFocus={() => void fetchCourseOptions()}
                  onChange={(e) => setAssignCourseId(e.target.value)}
                  className="flex-1 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition-all focus:border-[var(--app-primary)]"
                >
                  <option value="">Kurs tanlang...</option>
                  {courseSelectOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} #{course.id}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => void handleAssignCourse()}
                disabled={assignCourseLoading || !assignCourseId}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-60"
              >
                {assignCourseLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <PlusCircle size={14} />
                )}
                Biriktirish
              </button>
            </div>
          )}

          {courseError && (
            <div className="mb-4 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {courseError}
            </div>
          )}

          {coursesLoading ? (
            <SectionSkeleton rows={2} />
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] border border-dashed border-[var(--app-border)] p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--app-surface-soft)] text-[var(--app-muted)]">
                <BookOpen size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-black text-[var(--app-text)]">
                Kurslar yo'q
              </p>
              <p className="mt-1 max-w-[180px] text-xs font-bold text-[var(--app-muted)]">
                Bu guruhga hozircha kurs biriktirilmagan.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((gCourse: any, idx: number) => {
                const course = gCourse.course;
                return (
                  <div
                    key={gCourse.id ?? idx}
                    className="group flex items-center gap-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm transition-all hover:border-[var(--app-primary)]/30 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-blue-50 text-[#2563eb] text-lg font-black transition-transform group-hover:scale-110">
                      {course?.title?.charAt(0) || "K"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black tracking-tight text-[var(--app-text)]">
                        {course?.title || "Noma'lum kurs"}
                      </h3>
                      <span className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#2563eb]">
                        {course?.level || "A1"}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() =>
                            void handleRemoveCourse(gCourse.id, idx)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90"
                          title="Kursni guruhdan olib tashlash"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/courses/${course?.id}`)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-all group-hover:bg-[#2563eb] group-hover:text-white active:scale-95"
                      >
                        <ChevronRight size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            A'ZOLAR
        ══════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)]">
              <Users size={14} className="text-[var(--app-primary)]" />
              Guruh a'zolari
              {membersLoading && <Loader2 size={12} className="animate-spin" />}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void fetchMembers()}
                className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 text-[var(--app-muted)] transition-all hover:text-[var(--app-primary)] active:scale-90"
                title="Yangilash"
              >
                <RefreshCw size={14} strokeWidth={2.5} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    setActionError(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:opacity-90 active:scale-95"
                >
                  <UserPlus size={13} />
                  Qo'shish
                </button>
              )}
            </div>
          </div>

          {membersLoading ? (
            <SectionSkeleton rows={3} />
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center rounded-[32px] border border-dashed border-[var(--app-border)] p-12 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--app-surface-soft)] text-[var(--app-muted)]">
                <UserCircle2 size={36} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-black text-[var(--app-text)]">
                O'quvchilar yo'q
              </p>
              <p className="mt-1 max-w-[200px] text-xs font-bold text-[var(--app-muted)]">
                Bu guruhda hozircha o'quvchilar mavjud emas.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
                >
                  <UserPlus size={14} />
                  O'quvchi qo'shish
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((member: any, idx: number) => {
                const student = member.student ?? member;
                const name =
                  student?.fullName ??
                  student?.full_name ??
                  "Noma'lum o'quvchi";
                const phone = student?.phone ?? "—";
                const level = student?.cefrLevel ?? student?.cefr_level ?? null;
                const sid = student?.id ?? member.studentId;
                const initial = name.charAt(0).toUpperCase();
                const colors = [
                  "from-blue-500 to-blue-400",
                  "from-emerald-500 to-teal-400",
                  "from-violet-500 to-purple-400",
                  "from-amber-500 to-orange-400",
                  "from-rose-500 to-pink-400",
                ];
                const color = colors[idx % colors.length];

                return (
                  <div
                    key={member.id ?? idx}
                    className="group flex items-center gap-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm transition-all hover:border-[var(--app-primary)]/30 hover:shadow-md"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-tr ${color} text-base font-black text-white shadow-inner`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black tracking-tight text-[var(--app-text)]">
                        {name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-[var(--app-muted)]">
                        <Phone size={10} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-wide">
                          {phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {level && (
                        <span className="rounded-lg bg-[var(--app-primary)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-primary)]">
                          {level}
                        </span>
                      )}
                      {isAdmin ? (
                        <button
                          onClick={() => void handleRemoveMember(sid, name)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90"
                          title="Guruhdan chiqarish"
                        >
                          <UserMinus size={12} />
                        </button>
                      ) : (
                        <span className="rounded-lg bg-[var(--app-surface-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                          Faol
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-t-[40px] bg-[var(--app-bg)] p-6 pb-safe shadow-2xl sm:rounded-[40px]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-black uppercase tracking-tight text-[var(--app-text)]">
                O'quvchi qo'shish
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setActionError(null);
                  setStudentIdInput("");
                }}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 text-[var(--app-muted)] transition-all active:scale-90"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                {actionError}
              </div>
            )}

            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              O'quvchi
            </label>

            {studentsLoading ? (
              <Sk className="mb-5 h-[56px] w-full" />
            ) : (
              <select
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="mb-5 w-full rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4 text-sm font-bold text-[var(--app-text)] shadow-sm outline-none transition-all focus:border-[var(--app-primary)]"
              >
                <option value="">O'quvchi tanlang...</option>
                {studentSelectOptions.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} #{student.id}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => void handleAddMember()}
              disabled={addLoading || !studentIdInput}
              className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[var(--app-primary)] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {addLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {addLoading ? "Qo'shilmoqda..." : "Guruhga qo'shish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
