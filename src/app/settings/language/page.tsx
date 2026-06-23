'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe2, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { updateCurrentProfile } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import { NoticeBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from '@/app/components/ui/DataDisplay';

const languages = [
  { value: 'UZ', label: "O'zbekcha" },
  { value: 'RU', label: 'Русский' },
  { value: 'EN', label: 'English' },
];

function normalizeLanguage(profile: any) {
  return profile?.language ?? profile?.profile?.language ?? 'UZ';
}

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { data: profile, loading, error, refetch } = useProfile();
  const currentLanguage = useMemo(() => normalizeLanguage(profile), [profile]);
  const [language, setLanguage] = useState('UZ');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  async function handleSave() {
    if (!languages.some((item) => item.value === language)) {
      setNotice("Noto'g'ri til tanlandi");
      return;
    }
    if (language === currentLanguage) {
      setNotice("Til o'zgarmagan");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await updateCurrentProfile({ language });
      await refetch();
      setNotice('Til sozlamasi yangilandi');
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Til sozlamasi saqlanmadi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoadingState title="Til yuklanmoqda" description="Profil ma'lumotlari olinmoqda" />;

  if (error) {
    return <PageErrorState title="Til sozlamasini olishda xatolik" description={error} retryLabel="Qayta urinish" onRetry={() => void refetch()} />;
  }

  return (
    <PageShell
      title="Til sozlamasi"
      subtitle="Profilingiz uchun asosiy interfeys tilini tanlang"
      action={
        <button onClick={() => router.push('/settings')} className={secondaryButtonClass}>
          <ArrowLeft size={14} />
          Sozlamalar
        </button>
      }
    >
      <NoticeBanner message={notice} />
      <div className="app-card mx-auto max-w-xl p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-[var(--app-primary)]">
            <Globe2 size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-base font-black text-[var(--app-text)]">Til</h2>
            <p className="text-xs font-semibold text-[var(--app-muted)]">Saqlangandan keyin profil qiymati yangilanadi.</p>
          </div>
        </div>
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className={fieldClass}>
          {languages.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => void handleSave()}
          disabled={saving || language === currentLanguage}
          className={`${primaryButtonClass} mt-4 w-full`}
        >
          <Save size={14} />
          {saving ? 'Saqlanmoqda' : 'Saqlash'}
        </button>
      </div>
    </PageShell>
  );
}
