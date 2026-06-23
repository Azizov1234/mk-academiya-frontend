'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit3,
  GraduationCap,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import {
  deleteGroupAssignment,
  getGroupAssignmentById,
  getGroupCourseById,
  getGroupMembersViaGroup,
  getGroupsByTeacherId,
  listGroupAssignments,
  updateGroupAssignment,
} from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import {
  Badge,
  CompactStat,
  EmptyBlock,
  JsonBlock,
  NoticeBanner,
  SectionTitle,
  fieldClass,
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/app/components/ui/DataDisplay';

type AnyRecord = Record<string, any>;

function getAssignmentTitle(item: AnyRecord) {
  return item?.task?.title ?? item?.test?.title ?? item?.title ?? `Assignment #${item?.id ?? '-'}`;
}

function getGroupLabel(item: AnyRecord) {
  return item?.group?.name ?? item?.groupName ?? item?.groupId ?? '-';
}

function formatDate(value: unknown) {
  if (!value) return 'Muddatsiz';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parsePositiveId(value: string) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeDueDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AnyRecord[]>([]);
  const [detail, setDetail] = useState<AnyRecord | null>(null);
  const [teacherGroups, setTeacherGroups] = useState<AnyRecord[]>([]);
  const [groupMembers, setGroupMembers] = useState<AnyRecord[]>([]);
  const [groupCourse, setGroupCourse] = useState<AnyRecord | null>(null);
  const [groupName, setGroupName] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupCourseId, setGroupCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      {
        label: 'Jami assignment',
        value: assignments.length,
        icon: ClipboardList,
        tone: 'primary' as const,
      },
      {
        label: 'Majburiy',
        value: assignments.filter((item) => Boolean(item?.isRequired)).length,
        icon: CheckCircle2,
        tone: 'success' as const,
      },
      {
        label: 'Muddati bor',
        value: assignments.filter((item) => Boolean(item?.dueDate)).length,
        icon: CalendarClock,
        tone: 'warning' as const,
      },
      {
        label: 'Memberlar',
        value: groupMembers.length,
        icon: Users,
        tone: 'muted' as const,
      },
    ],
    [assignments, groupMembers.length],
  );

  async function loadAssignments(filter = groupName) {
    try {
      setLoading(true);
      setError(null);
      setAssignments(await listGroupAssignments(filter));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Assignmentlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssignments('');
  }, []);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadAssignments(groupName);
  }

  async function loadAssignmentDetail(id: number) {
    try {
      setSaving(true);
      const item = await getGroupAssignmentById(id);
      setDetail(item);
      setAssignmentId(String(id));
      setDueDate(item?.dueDate ? String(item.dueDate).slice(0, 16) : '');
      setIsRequired(Boolean(item?.isRequired));
      setNotice("Assignment detali yuklandi");
    } catch (detailError) {
      setNotice(detailError instanceof Error ? detailError.message : "Assignment detali topilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = parsePositiveId(assignmentId);
    if (!id) {
      setNotice("Assignment ID noto'g'ri");
      return;
    }
    const nextDueDate = normalizeDueDate(dueDate);
    if (dueDate && !nextDueDate) {
      setNotice("Deadline formati noto'g'ri");
      return;
    }

    try {
      setSaving(true);
      await updateGroupAssignment(id, {
        dueDate: nextDueDate,
        isRequired,
      });
      setAssignments(await listGroupAssignments(groupName));
      setDetail(await getGroupAssignmentById(id));
      setNotice("Assignment yangilandi");
    } catch (updateError) {
      setNotice(updateError instanceof Error ? updateError.message : "Assignment yangilanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(id: number) {
    if (!window.confirm("Assignmentni o'chirishni tasdiqlaysizmi?")) return;

    try {
      setSaving(true);
      await deleteGroupAssignment(id);
      setAssignments(await listGroupAssignments(groupName));
      if (Number(assignmentId) === id) {
        setDetail(null);
        setAssignmentId('');
      }
      setNotice("Assignment o'chirildi");
    } catch (deleteError) {
      setNotice(deleteError instanceof Error ? deleteError.message : "Assignment o'chirilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleTeacherGroups(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setTeacherGroups(await getGroupsByTeacherId(Number(teacherId)));
      setNotice("Teacher guruhlari yuklandi");
    } catch (groupsError) {
      setNotice(groupsError instanceof Error ? groupsError.message : "Teacher guruhlari yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleGroupMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setGroupMembers(await getGroupMembersViaGroup(Number(groupId)));
      setNotice("Group memberlari yuklandi");
    } catch (membersError) {
      setNotice(membersError instanceof Error ? membersError.message : "Group memberlari yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleGroupCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setGroupCourse(await getGroupCourseById(Number(groupCourseId)));
      setNotice("Group-course detali yuklandi");
    } catch (courseError) {
      setNotice(courseError instanceof Error ? courseError.message : "Group-course detali yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Biriktirishlar" subtitle="Group assignment boshqaruvi">
        <PageLoadingState title="Assignmentlar yuklanmoqda" description="Group assignment APIlari tekshirilmoqda" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Biriktirishlar" subtitle="Xatolik">
        <PageErrorState title="Assignmentlar yuklanmadi" description={error} retryLabel="Qayta urinish" onRetry={() => void loadAssignments()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Biriktirishlar"
      subtitle="Guruh topshiriqlari, muddatlar va yordamchi endpointlar"
      action={
        <button onClick={() => void loadAssignments()} className={secondaryButtonClass}>
          <RefreshCcw size={14} />
          Yangilash
        </button>
      }
    >
      <NoticeBanner message={notice} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <CompactStat key={stat.label} {...stat} />
        ))}
      </div>

      <form
        onSubmit={handleFilter}
        className="mb-5 grid gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 sm:grid-cols-[1fr_auto]"
      >
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            strokeWidth={2.5}
          />
          <input
            className={`${fieldClass} pl-10`}
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Guruh nomi bo'yicha qidirish"
          />
        </div>
        <button className={primaryButtonClass}>
          <Search size={14} />
          Qidirish
        </button>
      </form>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="app-card p-5">
          <SectionTitle
            title="Assignment ro'yxati"
            description="Topshiriqlarni tanlang, muddatini yangilang yoki keraksizini olib tashlang."
            icon={ClipboardList}
          />

          <div className="space-y-3">
            {assignments.map((item, index) => {
              const id = Number(item?.id);
              const selected = Number(assignmentId) === id;

              return (
                <article
                  key={`${item?.id ?? index}`}
                  className={`rounded-lg border p-4 transition-all ${
                    selected
                      ? 'border-[var(--app-primary)] bg-[color:color-mix(in_srgb,var(--app-primary)_7%,white)]'
                      : 'border-[var(--app-border)] bg-white hover:border-[var(--app-primary)]/35'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone={item?.isRequired ? 'success' : 'muted'}>
                          {item?.isRequired ? 'Majburiy' : 'Ixtiyoriy'}
                        </Badge>
                        <Badge tone="primary">ID {item?.id ?? '-'}</Badge>
                      </div>
                      <h3 className="truncate text-base font-black text-[var(--app-text)]">
                        {getAssignmentTitle(item)}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[var(--app-muted)]">
                        <span>Group: {getGroupLabel(item)}</span>
                        <span>Deadline: {formatDate(item?.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item?.id ? (
                        <button
                          className={iconButtonClass}
                          onClick={() => void loadAssignmentDetail(Number(item.id))}
                          title="Tahrirlash"
                          aria-label="Assignmentni tahrirlash"
                        >
                          <Edit3 size={16} />
                        </button>
                      ) : null}
                      {item?.id ? (
                        <button
                          className={iconButtonClass}
                          onClick={() => void removeAssignment(Number(item.id))}
                          title="O'chirish"
                          aria-label="Assignmentni o'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {!assignments.length ? (
              <EmptyBlock
                title="Assignment topilmadi"
                description="Qidiruvni tozalang yoki boshqa guruh nomi bilan tekshirib ko'ring."
              />
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <form onSubmit={handleUpdateAssignment} className="app-card p-5">
            <SectionTitle
              title="Assignment detali"
              description="Tanlangan assignment uchun muddat va majburiylik holatini yangilang."
              icon={CalendarClock}
            />

            <div className="grid gap-3">
              <input
                className={fieldClass}
                type="number"
                value={assignmentId}
                onChange={(event) => setAssignmentId(event.target.value)}
                placeholder="assignmentId"
                required
              />
              <input
                className={fieldClass}
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(event) => setIsRequired(event.target.checked)}
                  className="h-4 w-4 accent-[var(--app-primary)]"
                />
                Majburiy assignment
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    const id = parsePositiveId(assignmentId);
                    if (!id) {
                      setNotice("Assignment ID noto'g'ri");
                      return;
                    }
                    void loadAssignmentDetail(id);
                  }}
                  disabled={!assignmentId || saving}
                >
                  Detail
                </button>
                <button className={primaryButtonClass} disabled={!assignmentId || saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Update
                </button>
              </div>
            </div>

            {detail ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-[var(--app-border)] bg-white p-4">
                  <p className="text-sm font-black text-[var(--app-text)]">
                    {getAssignmentTitle(detail)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">
                    Group: {getGroupLabel(detail)} | Deadline: {formatDate(detail?.dueDate)}
                  </p>
                </div>
                <JsonBlock data={detail} />
              </div>
            ) : null}
          </form>

          <div className="grid gap-5">
            <form onSubmit={handleTeacherGroups} className="app-card p-5">
              <SectionTitle title="Teacher guruhlari" icon={GraduationCap} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className={fieldClass}
                  type="number"
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  placeholder="teacherId"
                  required
                />
                <button className={secondaryButtonClass} disabled={saving}>
                  Yuklash
                </button>
              </div>
              {teacherGroups.length ? <JsonBlock className="mt-4" data={teacherGroups} /> : null}
            </form>

            <form onSubmit={handleGroupMembers} className="app-card p-5">
              <SectionTitle title="Group memberlari" icon={Users} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className={fieldClass}
                  type="number"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  placeholder="groupId"
                  required
                />
                <button className={secondaryButtonClass} disabled={saving}>
                  Yuklash
                </button>
              </div>
              {groupMembers.length ? <JsonBlock className="mt-4" data={groupMembers} /> : null}
            </form>

            <form onSubmit={handleGroupCourse} className="app-card p-5">
              <SectionTitle title="Group-course detali" icon={ClipboardList} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className={fieldClass}
                  type="number"
                  value={groupCourseId}
                  onChange={(event) => setGroupCourseId(event.target.value)}
                  placeholder="groupCourseId"
                  required
                />
                <button className={secondaryButtonClass} disabled={saving}>
                  Yuklash
                </button>
              </div>
              {groupCourse ? <JsonBlock className="mt-4" data={groupCourse} /> : null}
            </form>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
