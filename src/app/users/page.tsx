"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  Search,
  Shield,
  UserPlus,
  UserRound,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import {
  activateUser,
  createAdmin,
  createStudent,
  createTeacher,
  getUserById,
  type CefrLevel,
  type UserDirectoryRole,
  CEFR_LEVELS,
  removeUser,
} from "@/lib/backend-api";
import { hasRoleCapability, isRoleAllowedForPath } from "@/lib/role-access";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageShell,
} from "@/app/components/ui/PagePrimitives";

type CreateRole = "ADMIN" | "TEACHER" | "STUDENT";

const ROLE_BADGES: Record<string, string> = {
  SUPERADMIN: "bg-red-50 text-red-600",
  ADMIN: "bg-amber-50 text-amber-600",
  TEACHER: "bg-blue-50 text-blue-600",
  STUDENT: "bg-blue-50 text-blue-600",
};

const ROLE_FILTERS: UserDirectoryRole[] = ["ADMIN", "TEACHER", "STUDENT"];

const EMPTY_FORM = {
  phone: "",
  passwordHash: "",
  fullName: "",
  cefrLevel: "",
};

export default function UsersPage() {
  const t = useTranslations("UsersPage");
  const uiT = useTranslations("UiStates");
  const { role, loading: authLoading } = useAuth();
  const canAccess = isRoleAllowedForPath("/users", role);
  const canManageUsers = hasRoleCapability(role, "manage_users");
  const canCreateAdmin = hasRoleCapability(role, "create_admin");
  const canCreateTeacher = hasRoleCapability(role, "create_teacher");
  const canCreateStudent = hasRoleCapability(role, "create_student");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserDirectoryRole | undefined>(
    undefined
  );
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [createRole, setCreateRole] = useState<CreateRole | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const query = useMemo(
    () => ({
      fullName: searchTerm,
      user: roleFilter,
      isActive: activeFilter,
      page: 1,
      limit: 20,
    }),
    [activeFilter, roleFilter, searchTerm]
  );

  const {
    data: users,
    loading,
    error,
    refetch,
  } = useUsers(role, query, canAccess && !authLoading, "role-specific");

  if (!authLoading && !canAccess) return null;

  const createOptions = [
    canCreateAdmin ? { role: "ADMIN" as const, label: "Admin" } : null,
    canCreateTeacher ? { role: "TEACHER" as const, label: "Teacher" } : null,
    canCreateStudent ? { role: "STUDENT" as const, label: "Student" } : null,
  ].filter(Boolean) as Array<{ role: CreateRole; label: string }>;

  async function handleCreateUser() {
    try {
      setSubmitting(true);
      setMutationError(null);

      if (!createRole) return;

      const payload = {
        phone: form.phone,
        passwordHash: form.passwordHash,
        fullName: form.fullName,
        cefrLevel: (form.cefrLevel || undefined) as CefrLevel | undefined,
      };

      if (createRole === "ADMIN") {
        await createAdmin(payload);
      } else if (createRole === "TEACHER") {
        await createTeacher(payload);
      } else {
        await createStudent(payload);
      }

      setCreateRole(null);
      setForm(EMPTY_FORM);
      await refetch();
    } catch (createError) {
      setMutationError(
        createError instanceof Error
          ? createError.message
          : "Foydalanuvchini yaratib bo'lmadi"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDetails(id: number) {
    try {
      setDetailLoading(true);
      setMutationError(null);
      const data = await getUserById(id);
      setSelectedUser(data);
    } catch (detailError) {
      setMutationError(
        detailError instanceof Error
          ? detailError.message
          : "Foydalanuvchi ma'lumotini ochib bo'lmadi"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleToggleActive(user: any) {
    try {
      setMutationError(null);
      if (user.isActive) {
        await removeUser(user.id);
      } else {
        await activateUser(user.id);
      }
      await refetch();
    } catch (toggleError) {
      setMutationError(
        toggleError instanceof Error
          ? toggleError.message
          : "Holatni yangilab bo'lmadi"
      );
    }
  }

  return (
    <PageShell
      title={t("title")}
      subtitle={t("total", { count: users.length })}
      action={
        canManageUsers ? (
          <div className="flex items-center gap-2">
            {createOptions.map((option) => (
              <button
                key={option.role}
                onClick={() => setCreateRole(option.role)}
                className="bg-[var(--app-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] py-3 pl-11 pr-4 text-sm font-semibold text-[var(--app-text)] transition-all focus:border-[var(--app-primary)] focus:outline-none sm:py-3.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleFilter(undefined)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              !roleFilter
                ? "bg-[var(--app-primary)] text-white"
                : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
            }`}
          >
            Barchasi
          </button>
          {ROLE_FILTERS.filter(
            (item) => !(item === "ADMIN" && role !== "superadmin")
          ).map((item) => (
            <button
              key={item}
              onClick={() => setRoleFilter(item)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                roleFilter === item
                  ? "bg-[var(--app-primary)] text-white"
                  : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
              }`}
            >
              {item}
            </button>
          ))}

          {canManageUsers ? (
            <>
              <button
                onClick={() => setActiveFilter(undefined)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                  activeFilter === undefined
                    ? "bg-[var(--app-surface-soft)] text-[var(--app-text)]"
                    : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
                }`}
              >
                Holat: barchasi
              </button>
              <button
                onClick={() => setActiveFilter(true)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                  activeFilter === true
                    ? "bg-blue-50 text-blue-700"
                    : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
                }`}
              >
                Faol
              </button>
              <button
                onClick={() => setActiveFilter(false)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                  activeFilter === false
                    ? "bg-red-50 text-red-700"
                    : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
                }`}
              >
                Nofaol
              </button>
            </>
          ) : null}
        </div>
      </div>

      {mutationError ? (
        <div className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {mutationError}
        </div>
      ) : null}

      {loading ? (
        <PageLoadingState
          title={uiT("loadingTitle")}
          description={uiT("loadingDescription")}
        />
      ) : error ? (
        <PageErrorState
          title={uiT("errorTitle")}
          description={error || uiT("errorDescription")}
          retryLabel={uiT("retry")}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : users.length === 0 ? (
        <PageEmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20 xl:grid-cols-2">
          {users.map((user: any, index: number) => (
            <div
              key={user.id || index}
              className="app-card flex flex-col gap-4 overflow-hidden p-4 transition-all sm:p-5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--app-surface-soft)] text-base font-black text-[var(--app-primary)] sm:h-14 sm:w-14 sm:text-lg">
                  {user.fullName?.charAt(0) || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold tracking-tight text-[var(--app-text)]">
                    {user.fullName || t("newUser")}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        ROLE_BADGES[user.role] ||
                        "bg-[var(--app-surface-soft)] text-[var(--app-muted)]"
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.cefrLevel ? (
                      <span className="bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                        {user.cefrLevel}
                      </span>
                    ) : null}
                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        user.isActive
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void handleOpenDetails(user.id)}
                  className="flex items-center justify-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-text)] transition-transform active:scale-95"
                >
                  {detailLoading && selectedUser?.id !== user.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Eye size={14} />
                  )}
                  Detail
                </button>

                {canManageUsers ? (
                  <button
                    onClick={() => void handleToggleActive(user)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95 ${
                      user.isActive ? "bg-red-500" : "bg-blue-500"
                    }`}
                  >
                    {user.isActive ? (
                      <XCircle size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {user.isActive ? "O'chirish" : "Faollashtirish"}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    <Shield size={14} />
                    Read only
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {createRole ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--app-primary)]/20 backdrop-blur-md px-3 sm:px-4">
          <div className="w-full max-w-md rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-2xl sm:rounded-[26px] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  {createRole} yaratish
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  DTO maydonlariga mos forma
                </p>
              </div>
              <button
                onClick={() => setCreateRole(null)}
                className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)]"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+998901234567"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <input
                value={form.passwordHash}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    passwordHash: event.target.value,
                  }))
                }
                placeholder="Password"
                type="password"
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              />
              <select
                value={form.cefrLevel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cefrLevel: event.target.value,
                  }))
                }
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold"
              >
                <option value="">CEFR level</option>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setCreateRole(null)}
                className="flex-1 rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-muted)]"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => void handleCreateUser()}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-[var(--app-primary)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--app-primary)]/20 backdrop-blur-md px-3 sm:px-4">
          <div className="w-full max-w-lg rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-2xl sm:rounded-[26px] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  {selectedUser.fullName}
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  User detail
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-[14px] bg-[var(--app-surface-soft)] p-3 text-[var(--app-muted)]"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[var(--app-surface-soft)] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Phone
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--app-text)]">
                  {selectedUser.phone || "-"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-soft)] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Role
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--app-text)]">
                  {selectedUser.role || "-"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-soft)] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  CEFR
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--app-text)]">
                  {selectedUser.cefrLevel || "-"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-soft)] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Status
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--app-text)]">
                  {selectedUser.isActive ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>
            </div>

            {Array.isArray(selectedUser.groupsCreated) &&
            selectedUser.groupsCreated.length > 0 ? (
              <div className="mt-4 rounded-[18px] bg-[var(--app-surface-soft)] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Groups
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUser.groupsCreated.map((group: any) => (
                    <span
                      key={group.id}
                      className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-text)]"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
