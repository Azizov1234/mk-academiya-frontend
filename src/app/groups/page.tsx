"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useProfile } from "@/hooks/useProfile";
import { useUsers } from "@/hooks/useUsers";
import { createGroup, deleteGroup, updateGroup } from "@/lib/backend-api";
import { hasRoleCapability } from "@/lib/role-access";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from "@/app/components/ui/PagePrimitives";

const EMPTY_FORM = {
  name: "",
  description: "",
  teacherId: "",
  inviteCode: "",
};

export default function GroupsPage() {
  const { role } = useAuth();
  const canManageGroups = hasRoleCapability(role, "manage_groups");
  const isTeacherRole = role === "teacher" || role === "mentor";
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const { data: groups, loading, error, refetch } = useGroups(searchTerm);
  const { data: profile } = useProfile(isTeacherRole);
  const { data: teachers } = useUsers(
    role,
    { user: "TEACHER", page: 1, limit: 100 },
    canManageGroups && !isTeacherRole,
    "role-specific"
  );

  const teacherOptions = useMemo(
    () => (Array.isArray(teachers) ? teachers : []),
    [teachers]
  );

  function openCreateModal() {
    setEditingGroup(null);
    setForm({
      ...EMPTY_FORM,
      teacherId: isTeacherRole ? String(profile?.id || "") : "",
    });
    setIsFormOpen(true);
  }

  function openEditModal(group: any) {
    setEditingGroup(group);
    setForm({
      name: group.name || "",
      description: group.description || "",
      teacherId: String(
        group.teacherId || group.teacher?.id || profile?.id || ""
      ),
      inviteCode: group.inviteCode || "",
    });
    setIsFormOpen(true);
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setMutationError(null);

      const payload = {
        name: form.name,
        description: form.description || undefined,
        teacherId: Number(form.teacherId),
        inviteCode: form.inviteCode,
      };

      if (editingGroup) {
        await updateGroup(editingGroup.id, payload);
      } else {
        await createGroup(payload);
      }

      setIsFormOpen(false);
      setEditingGroup(null);
      setForm(EMPTY_FORM);
      await refetch();
    } catch (groupError) {
      setMutationError(
        groupError instanceof Error
          ? groupError.message
          : "Guruhni saqlab bo'lmadi"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setMutationError(null);
      await deleteGroup(id);
      await refetch();
    } catch (groupError) {
      setMutationError(
        groupError instanceof Error
          ? groupError.message
          : "Guruhni o'chirib bo'lmadi"
      );
    }
  }

  return (
    <PageShell
      title="Guruhlar"
      subtitle={`Jami: ${groups.length} ta`}
      action={
        canManageGroups ? (
          <button
            onClick={openCreateModal}
            className="bg-[var(--app-primary)] p-3 text-white transition-transform active:scale-95"
          >
            <PlusCircle size={20} strokeWidth={2.5} />
          </button>
        ) : undefined
      }
    >
      <div className="mb-5 relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
        />
        <input
          type="text"
          placeholder="Guruhlarni qidirish..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] py-3 pl-11 pr-4 text-sm font-semibold text-[var(--app-text)] transition-all focus:border-[var(--app-primary)] focus:outline-none sm:py-3.5"
        />
      </div>

      {mutationError ? (
        <div className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {mutationError}
        </div>
      ) : null}

      {loading ? (
        <PageLoadingState
          title="Guruhlar yuklanmoqda"
          description="Backenddagi group ro'yxati olinmoqda"
        />
      ) : error ? (
        <PageErrorState
          title="Guruhlarni olishda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      ) : groups.length > 0 ? (
        <div className="flex flex-col gap-4 pb-20">
          {groups.map((group: any) => (
            <div
              key={group.id}
              className="app-card group flex flex-col gap-4 p-4 sm:p-5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--app-surface-soft)] text-base font-black text-[var(--app-primary)] sm:h-14 sm:w-14 sm:text-lg">
                  {group.name?.charAt(0) || "G"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold tracking-tight text-[var(--app-text)] sm:text-lg">
                    {group.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                      {group.teacher?.fullName || "Teacher"}
                    </span>
                    <span className="bg-[var(--app-primary)]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--app-primary)]">
                      <Users size={10} className="mr-1 inline-flex" />
                      {group._count?.members || 0}
                    </span>
                    <span className="bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-700">
                      {group.inviteCode}
                    </span>
                  </div>
                </div>
              </div>

              {group.description ? (
                <p className="text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                  {group.description}
                </p>
              ) : null}

              <div
                className={`grid gap-2 ${
                  canManageGroups ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"
                }`}
              >
                <div className="flex items-center justify-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-text)]">
                  <ChevronRight size={14} />
                  Ko'rish
                </div>

                {canManageGroups ? (
                  <>
                    <button
                      onClick={() => openEditModal(group)}
                      className="flex items-center justify-center gap-2 bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--app-primary-dark)] active:scale-95"
                    >
                      <Pencil size={14} />
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => void handleDelete(group.id)}
                      className="flex items-center justify-center gap-2 bg-red-500 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
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
      ) : (
        <PageEmptyState
          title="Guruh topilmadi"
          description="Hozircha filterga mos guruh yo'q."
        />
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--app-primary)]/20 backdrop-blur-md px-3 sm:px-4">
          <div className="w-full max-w-md rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-xl animate-scale-in sm:max-w-lg sm:rounded-[26px] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  {editingGroup ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  CreateGroupDto maydonlari
                </p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingGroup(null);
                }}
                className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)]"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Group name"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Description"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />

              {isTeacherRole ? (
                <input
                  value={form.teacherId}
                  readOnly
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--app-muted)]"
                />
              ) : (
                <select
                  value={form.teacherId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      teacherId: event.target.value,
                    }))
                  }
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
                >
                  <option value="">Teacher tanlang</option>
                  {teacherOptions.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName} #{teacher.id}
                    </option>
                  ))}
                </select>
              )}

              <input
                value={form.inviteCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    inviteCode: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Invite code"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold uppercase"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingGroup(null);
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
