'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Loader2,
  Medal,
  Plus,
  RefreshCcw,
  Star,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  addXp,
  createRating,
  deleteRating,
  getCurrentProfile,
  getLeaderboard,
  getRatingsByTarget,
  getStudentAchievements,
  getXpRank,
  listAchievements,
  listRatings,
} from '@/lib/backend-api';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleCapability } from '@/lib/role-access';
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
  textareaClass,
} from '@/app/components/ui/DataDisplay';

type AnyRecord = Record<string, any>;

function getId(item: AnyRecord) {
  return Number(item?.id ?? item?.userId ?? item?.studentId ?? 0);
}

function getTitle(item: AnyRecord, fallback: string) {
  return item?.title ?? item?.name ?? item?.fullName ?? item?.student?.fullName ?? item?.user?.fullName ?? fallback;
}

function getProfileId(profile: AnyRecord | null) {
  const direct = Number(profile?.user?.id ?? profile?.userId ?? profile?.studentId ?? profile?.id);
  return Number.isFinite(direct) && direct > 0 ? direct : null;
}

function getPoints(item: AnyRecord) {
  return Number(item?.xp ?? item?.points ?? item?.score ?? 0);
}

function getScoreTone(score: unknown) {
  const value = Number(score);
  if (value >= 4) return 'success' as const;
  if (value >= 3) return 'warning' as const;
  return 'muted' as const;
}

export default function GamificationPage() {
  const { role } = useAuth();
  const canManageGamification = hasRoleCapability(role, 'manage_gamification');
  const [achievements, setAchievements] = useState<AnyRecord[]>([]);
  const [studentAchievements, setStudentAchievements] = useState<AnyRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<AnyRecord[]>([]);
  const [ratings, setRatings] = useState<AnyRecord[]>([]);
  const [targetRatings, setTargetRatings] = useState<AnyRecord[]>([]);
  const [xpRank, setXpRank] = useState<AnyRecord | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [ratingForm, setRatingForm] = useState({ userId: '', targetType: 'course', targetId: '', score: '5', reviewText: '' });
  const [targetForm, setTargetForm] = useState({ targetType: 'course', targetId: '' });
  const [xpForm, setXpForm] = useState({ userId: '', amount: '10', reason: 'manual_adjustment' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      { label: 'Achievements', value: achievements.length, icon: Award, tone: 'primary' as const },
      { label: 'Mening yutuqlarim', value: studentAchievements.length, icon: Medal, tone: 'success' as const },
      { label: 'Leaderboard', value: leaderboard.length, icon: Trophy, tone: 'warning' as const },
      { label: 'Ratings', value: ratings.length, icon: Star, tone: 'muted' as const },
    ],
    [achievements.length, leaderboard.length, ratings.length, studentAchievements.length],
  );

  const currentRank = xpRank?.rank ?? xpRank?.position ?? xpRank?.place ?? '-';
  const currentXp = xpRank?.xp ?? xpRank?.points ?? xpRank?.score ?? '-';

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      setNotice(null);

      const profile = await getCurrentProfile().catch(() => null);
      const currentProfileId = getProfileId(profile);
      setProfileId(currentProfileId);
      if (currentProfileId && canManageGamification) {
        setXpForm((current) => ({ ...current, userId: current.userId || String(currentProfileId) }));
      }

      const [achievementRes, leaderboardRes, ratingsRes, studentAchievementRes, xpRankRes] = await Promise.allSettled([
        listAchievements(),
        getLeaderboard(20),
        canManageGamification ? listRatings() : Promise.resolve([]),
        currentProfileId ? getStudentAchievements(currentProfileId) : Promise.resolve([]),
        currentProfileId ? getXpRank(currentProfileId) : Promise.resolve(null),
      ]);

      if (achievementRes.status === 'fulfilled') setAchievements(achievementRes.value);
      if (leaderboardRes.status === 'fulfilled') setLeaderboard(leaderboardRes.value);
      if (ratingsRes.status === 'fulfilled') setRatings(ratingsRes.value);
      if (studentAchievementRes.status === 'fulfilled') setStudentAchievements(studentAchievementRes.value);
      if (xpRankRes.status === 'fulfilled') setXpRank(xpRankRes.value);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gamification ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [canManageGamification]);

  async function handleCreateRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGamification) {
      setNotice("Rating yaratish uchun admin ruxsati kerak");
      return;
    }
    const userId = Number(ratingForm.userId);
    const score = Number(ratingForm.score);
    const targetType = ratingForm.targetType.trim();
    const targetId = ratingForm.targetId.trim();

    if (!Number.isFinite(userId) || userId <= 0) {
      setNotice("Rating yaratish uchun userId kiriting");
      return;
    }
    if (!targetType || !targetId) {
      setNotice("Target type va target ID to'ldirilishi kerak");
      return;
    }
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      setNotice("Rating score 1 dan 5 gacha bo'lishi kerak");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await createRating({
        userId,
        targetType,
        targetId,
        score,
        reviewText: ratingForm.reviewText.trim() || undefined,
      });
      setRatingForm((current) => ({ ...current, reviewText: '' }));
      setRatings(await listRatings());
      setNotice('Rating saqlandi');
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Rating saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRating(id: number) {
    if (!canManageGamification) {
      setNotice("Rating o'chirish uchun admin ruxsati kerak");
      return;
    }
    if (!window.confirm("Ratingni o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      setSaving(true);
      await deleteRating(id);
      setRatings(await listRatings());
      setNotice("Rating o'chirildi");
    } catch (deleteError) {
      setNotice(deleteError instanceof Error ? deleteError.message : "Rating o'chirilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleTargetRatings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGamification) {
      setNotice("Target ratinglarini ko'rish uchun admin ruxsati kerak");
      return;
    }
    const targetType = targetForm.targetType.trim();
    const targetId = targetForm.targetId.trim();
    if (!targetType || !targetId) {
      setNotice("Target type va target ID kiriting");
      return;
    }

    try {
      setSaving(true);
      setTargetRatings(await getRatingsByTarget(targetType, targetId));
      setNotice("Target ratinglari yuklandi");
    } catch (targetError) {
      setNotice(targetError instanceof Error ? targetError.message : "Target ratinglari yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddXp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGamification) {
      setNotice("XP qo'shish uchun admin ruxsati kerak");
      return;
    }
    const userId = Number(xpForm.userId);
    const amount = Number(xpForm.amount);
    if (!Number.isFinite(userId) || userId <= 0) {
      setNotice("XP uchun userId kiriting");
      return;
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
      setNotice("XP miqdori 1 dan 10000 gacha bo'lishi kerak");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await addXp(userId, { amount, reason: xpForm.reason.trim() || undefined });
      setXpRank(await getXpRank(userId));
      setLeaderboard(await getLeaderboard(20));
      setNotice("XP so'rovi yuborildi");
    } catch (xpError) {
      setNotice(xpError instanceof Error ? xpError.message : "XP qo'shish backendda xatolik qaytardi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Gamification" subtitle="Achievements, leaderboard va ratinglar">
        <PageLoadingState title="Gamification yuklanmoqda" description="Backend APIlardan ma'lumotlar olinmoqda" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Gamification" subtitle="Xatolik">
        <PageErrorState title="Ma'lumot yuklanmadi" description={error} retryLabel="Qayta urinish" onRetry={() => void loadData()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Gamification"
      subtitle={canManageGamification ? 'XP, leaderboard, achievements va rating boshqaruvi' : "Leaderboard, rank va yutuqlar"}
      action={
        <button onClick={() => void loadData()} className={secondaryButtonClass}>
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

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="app-card p-5">
            <SectionTitle
              title="Leaderboard"
              description="Eng faol foydalanuvchilar reytingi va XP ko'rsatkichlari."
              icon={Trophy}
            />
            <div className="space-y-3">
              {leaderboard.map((item, index) => {
                const points = getPoints(item);
                const width = Math.min(100, Math.max(8, points));

                return (
                  <article
                    key={`${getId(item)}-${index}`}
                    className="rounded-lg border border-[var(--app-border)] bg-white p-4 transition-all hover:border-[var(--app-primary)]/35"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-sm font-black text-[var(--app-primary)]">
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-[var(--app-text)]">{getTitle(item, 'User')}</p>
                          <p className="text-xs font-semibold text-[var(--app-muted)]">ID: {getId(item) || '-'}</p>
                        </div>
                      </div>
                      <Badge tone={index < 3 ? 'warning' : 'primary'}>{points} XP</Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--app-primary)] transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </article>
                );
              })}
              {!leaderboard.length ? <EmptyBlock title="Leaderboard bo'sh" description="Hali XP yozuvlari kelmadi." /> : null}
            </div>
          </div>

          <div className="app-card p-5">
            <SectionTitle
              title="Achievements"
              description="Platformadagi yutuqlar va ularning shartlari."
              icon={Award}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {achievements.map((item, index) => (
                <article
                  key={`${item?.id ?? index}`}
                  className="rounded-lg border border-[var(--app-border)] bg-white p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-700">
                      <Medal size={17} strokeWidth={2.5} />
                    </span>
                    <p className="min-w-0 truncate font-black text-[var(--app-text)]">{getTitle(item, 'Achievement')}</p>
                  </div>
                  <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                    {item?.description ?? item?.condition ?? "Tavsif yo'q"}
                  </p>
                </article>
              ))}
              {!achievements.length ? (
                <EmptyBlock className="md:col-span-2" title="Achievementlar topilmadi" description="Backenddan yutuqlar ro'yxati kelmadi." />
              ) : null}
            </div>
          </div>

          <div className="app-card p-5">
            <SectionTitle title="Mening rankim" description="Joriy profilning XP va yutuqlar kesimi." icon={Zap} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--app-border)] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">User ID</p>
                <p className="mt-1 text-xl font-black text-[var(--app-text)]">{profileId ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-[var(--app-border)] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">Rank</p>
                <p className="mt-1 text-xl font-black text-[var(--app-text)]">{currentRank}</p>
              </div>
              <div className="rounded-lg border border-[var(--app-border)] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">XP</p>
                <p className="mt-1 text-xl font-black text-[var(--app-text)]">{currentXp}</p>
              </div>
            </div>
            <JsonBlock className="mt-4" data={{ profileId, xpRank, studentAchievements }} />
          </div>
        </section>

        {canManageGamification ? (
          <section className="space-y-5">
            <form onSubmit={handleCreateRating} className="app-card p-5">
              <SectionTitle title="Rating yaratish" description="Course, book yoki boshqa target uchun baho qo'shing." icon={Star} />
              <div className="grid gap-3">
                <input
                  className={fieldClass}
                  type="number"
                  value={ratingForm.userId}
                  onChange={(event) => setRatingForm({ ...ratingForm, userId: event.target.value })}
                  placeholder="userId"
                  required
                />
                <input
                  className={fieldClass}
                  value={ratingForm.targetType}
                  onChange={(event) => setRatingForm({ ...ratingForm, targetType: event.target.value })}
                  placeholder="targetType"
                  required
                />
                <input
                  className={fieldClass}
                  value={ratingForm.targetId}
                  onChange={(event) => setRatingForm({ ...ratingForm, targetId: event.target.value })}
                  placeholder="targetId"
                  required
                />
                <input
                  className={fieldClass}
                  type="number"
                  min="1"
                  max="5"
                  value={ratingForm.score}
                  onChange={(event) => setRatingForm({ ...ratingForm, score: event.target.value })}
                  placeholder="score"
                  required
                />
                <textarea
                  className={textareaClass}
                  value={ratingForm.reviewText}
                  onChange={(event) => setRatingForm({ ...ratingForm, reviewText: event.target.value })}
                  placeholder="Review text"
                />
                <button className={primaryButtonClass} disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Saqlash
                </button>
              </div>
            </form>

            <form onSubmit={handleTargetRatings} className="app-card p-5">
              <SectionTitle title="Target ratinglari" description="Muayyan target bo'yicha ratinglarni ko'ring." icon={Star} />
              <div className="grid gap-3">
                <input
                  className={fieldClass}
                  value={targetForm.targetType}
                  onChange={(event) => setTargetForm({ ...targetForm, targetType: event.target.value })}
                  placeholder="targetType"
                  required
                />
                <input
                  className={fieldClass}
                  value={targetForm.targetId}
                  onChange={(event) => setTargetForm({ ...targetForm, targetId: event.target.value })}
                  placeholder="targetId"
                  required
                />
                <button className={secondaryButtonClass} disabled={saving}>
                  Yuklash
                </button>
              </div>
              {targetRatings.length ? <JsonBlock className="mt-4" data={targetRatings} /> : null}
            </form>

            <form onSubmit={handleAddXp} className="app-card p-5">
              <SectionTitle title="XP qo'shish" description="Foydalanuvchiga manual XP adjustment yuborish." icon={Zap} />
              <div className="grid gap-3">
                <input
                  className={fieldClass}
                  type="number"
                  value={xpForm.userId}
                  onChange={(event) => setXpForm({ ...xpForm, userId: event.target.value })}
                  placeholder="userId"
                  required
                />
                <input
                  className={fieldClass}
                  type="number"
                  value={xpForm.amount}
                  onChange={(event) => setXpForm({ ...xpForm, amount: event.target.value })}
                  placeholder="amount"
                  required
                />
                <input
                  className={fieldClass}
                  value={xpForm.reason}
                  onChange={(event) => setXpForm({ ...xpForm, reason: event.target.value })}
                  placeholder="reason"
                />
                <button className={primaryButtonClass} disabled={saving}>
                  XP yuborish
                </button>
              </div>
            </form>

            <div className="app-card p-5">
              <SectionTitle title="Ratinglar" description="Oxirgi rating yozuvlari." icon={Star} />
              <div className="space-y-3">
                {ratings.map((item, index) => (
                  <article
                    key={`${item?.id ?? index}`}
                    className="rounded-lg border border-[var(--app-border)] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone={getScoreTone(item?.score)}>Score {item?.score ?? '-'}</Badge>
                          <Badge tone="primary">ID {item?.id ?? '-'}</Badge>
                        </div>
                        <p className="truncate font-black text-[var(--app-text)]">
                          {item?.targetType ?? 'target'} #{item?.targetId ?? '-'}
                        </p>
                        {item?.reviewText ? (
                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--app-muted)]">
                            {item.reviewText}
                          </p>
                        ) : null}
                      </div>
                      {item?.id ? (
                        <button
                          onClick={() => void handleDeleteRating(Number(item.id))}
                          className={iconButtonClass}
                          disabled={saving}
                          title="Ratingni o'chirish"
                          aria-label="Ratingni o'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
                {!ratings.length ? <EmptyBlock title="Ratinglar yo'q" description="Hali rating yozuvlari kelmadi." /> : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="app-card p-5">
              <SectionTitle
                title="Ko'rish rejimi"
                description="Student, teacher va mentor rollari bu sahifada faqat leaderboard, rank va achievement ma'lumotlarini ko'radi."
                icon={Star}
              />
              <EmptyBlock
                title="Admin amallari yopiq"
                description="Rating yaratish, rating o'chirish va XP qo'shish faqat admin va superadmin rollarida ko'rinadi hamda submit handlerlarda ham bloklanadi."
                icon={Zap}
              />
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
