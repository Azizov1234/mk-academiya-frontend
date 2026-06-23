'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { updateCurrentProfile } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import { NoticeBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from '@/app/components/ui/DataDisplay';

function normalizeEmail(profile: any) {
  return profile?.email ?? profile?.profile?.email ?? '';
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const { data: profile, loading, error, refetch } = useProfile();
  const currentEmail = useMemo(() => normalizeEmail(profile), [profile]);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail]);

  async function handleSave() {
    const nextEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setNotice("To'g'ri email manzil kiriting");
      return;
    }
    if (nextEmail === currentEmail) {
      setNotice("Email o'zgarmagan");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await updateCurrentProfile({ email: nextEmail });
      await refetch();
      setNotice('Email yangilandi');
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Email saqlanmadi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoadingState title="Email yuklanmoqda" description="Profil ma'lumotlari olinmoqda" />;

  if (error) {
    return <PageErrorState title="Emailni olishda xatolik" description={error} retryLabel="Qayta urinish" onRetry={() => void refetch()} />;
  }

  return (
    <PageShell
      title="Email manzil"
      subtitle="Profilingizga biriktirilgan emailni yangilang"
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
            <Mail size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-base font-black text-[var(--app-text)]">Email</h2>
            <p className="text-xs font-semibold text-[var(--app-muted)]">Login va bildirishnomalar uchun ishlatiladi.</p>
          </div>
        </div>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
          placeholder="name@example.com"
        />
        <button
          onClick={() => void handleSave()}
          disabled={saving || email.trim() === currentEmail}
          className={`${primaryButtonClass} mt-4 w-full`}
        >
          <Save size={14} />
          {saving ? 'Saqlanmoqda' : 'Saqlash'}
        </button>
      </div>
    </PageShell>
  );
}
