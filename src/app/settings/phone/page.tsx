'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { updateCurrentProfile } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import { NoticeBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from '@/app/components/ui/DataDisplay';

function normalizePhone(profile: any) {
  return profile?.user?.phone ?? profile?.profile?.phone ?? profile?.phone ?? '';
}

export default function PhoneSettingsPage() {
  const router = useRouter();
  const { data: profile, loading, error, refetch } = useProfile();
  const currentPhone = useMemo(() => normalizePhone(profile), [profile]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPhone(currentPhone);
  }, [currentPhone]);

  async function handleSave() {
    const normalized = phone.replace(/\s+/g, '');
    if (!/^\+?\d{9,15}$/.test(normalized)) {
      setNotice("Telefon raqamni +998901234567 formatida kiriting");
      return;
    }
    if (normalized === currentPhone) {
      setNotice("Telefon raqam o'zgarmagan");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await updateCurrentProfile({ phone: normalized });
      await refetch();
      setNotice('Telefon raqam yangilandi');
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Telefon raqam saqlanmadi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoadingState title="Telefon yuklanmoqda" description="Profil ma'lumotlari olinmoqda" />;

  if (error) {
    return <PageErrorState title="Telefonni olishda xatolik" description={error} retryLabel="Qayta urinish" onRetry={() => void refetch()} />;
  }

  return (
    <PageShell
      title="Telefon raqam"
      subtitle="Profilingizdagi aloqa raqamini yangilang"
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
            <Phone size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-base font-black text-[var(--app-text)]">Telefon</h2>
            <p className="text-xs font-semibold text-[var(--app-muted)]">Login va aloqa uchun asosiy raqam.</p>
          </div>
        </div>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
          placeholder="+998901234567"
        />
        <button
          onClick={() => void handleSave()}
          disabled={saving || phone.replace(/\s+/g, '') === currentPhone}
          className={`${primaryButtonClass} mt-4 w-full`}
        >
          <Save size={14} />
          {saving ? 'Saqlanmoqda' : 'Saqlash'}
        </button>
      </div>
    </PageShell>
  );
}
