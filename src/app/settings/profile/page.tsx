'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { updateCurrentProfile } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState } from '@/app/components/ui/PagePrimitives';
import { disableSecureScreen, enableSecureScreen } from '@/lib/screen-security';
import { useCenterBranding } from '@/app/components/branding/CenterBrandingProvider';
import { NoticeBanner } from '@/app/components/ui/DataDisplay';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { centerBranding } = useCenterBranding();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: profile, loading, error, refetch } = useProfile();

  useEffect(() => {
    void enableSecureScreen();

    return () => {
      void disableSecureScreen();
    };
  }, []);

  const normalizedProfile = useMemo(() => {
    const user = profile?.user || {};

    return {
      fullName: user.fullName || profile?.fullName || '',
      email: profile?.email || '',
      phone: user.phone || profile?.phone || '',
    };
  }, [profile]);

  useEffect(() => {
    setFullName(normalizedProfile.fullName);
  }, [normalizedProfile.fullName]);

  async function handleSave() {
    const nextFullName = fullName.trim();
    if (nextFullName.length < 2) {
      setNotice("To'liq ism kamida 2 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (nextFullName === normalizedProfile.fullName) {
      setNotice("Ism o'zgarmagan");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await updateCurrentProfile({ fullName: nextFullName });
      await refetch();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (profileError) {
      setNotice(profileError instanceof Error ? profileError.message : 'Profil saqlanmadi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-page pb-nav-safe lg:pb-14 pt-4 sm:pt-6">
        <PageLoadingState title="Profil yuklanmoqda" description="Foydalanuvchi ma'lumotlari olinmoqda" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page pb-nav-safe lg:pb-14 pt-4 sm:pt-6">
        <PageErrorState
          title="Profilni olishda xatolik"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 app-page pb-nav-safe lg:pb-14 pt-4 sm:pt-6">
      <div className="mb-6 flex items-center gap-3 sm:mb-10 sm:gap-4">
        <button onClick={() => router.back()} className="app-touch border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-text)] transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--app-primary-dark)]">Profil sozlamalari</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest leading-none text-[var(--app-muted)]">
            {centerBranding.shortName} Profile
          </p>
        </div>
      </div>

      <NoticeBanner message={notice} />

      <div className="mb-8 flex flex-col gap-6 border border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:gap-8 sm:p-8">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center border border-[var(--app-border)] bg-[var(--app-primary)] text-3xl font-black text-white sm:h-28 sm:w-28 sm:text-4xl">
            {(fullName || normalizedProfile.fullName || 'U').charAt(0)}
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest px-2">TO&apos;LIQ ISM</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3.5 text-sm font-black text-[var(--app-text)] transition-all placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)]/10 sm:px-6 sm:py-4 sm:text-base"
              placeholder="Ismingizni kiriting"
            />
          </div>
          <div className="flex flex-col gap-2.5 opacity-60 grayscale cursor-not-allowed">
            <label className="text-[10px] font-black uppercase tracking-widest px-2 text-[var(--app-muted)]">EMAIL MANZIL (READ-ONLY)</label>
            <div className="w-full overflow-hidden text-ellipsis border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3.5 text-sm font-black text-[var(--app-muted)] sm:px-6 sm:py-4 sm:text-base">
              {normalizedProfile.email || '-'}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 opacity-60 grayscale cursor-not-allowed">
            <label className="text-[10px] font-black uppercase tracking-widest px-2 text-[var(--app-muted)]">TELEFON (READ-ONLY)</label>
            <div className="w-full overflow-hidden text-ellipsis border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3.5 text-sm font-black text-[var(--app-muted)] sm:px-6 sm:py-4 sm:text-base">
              {normalizedProfile.phone || '-'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => void handleSave()}
        disabled={saving || fullName.trim() === normalizedProfile.fullName}
        className={`mx-auto flex w-full max-w-md items-center justify-center gap-3 border border-[var(--app-primary)] p-3.5 font-black tracking-tight text-white transition-all active:scale-[0.98] sm:p-5 ${
          success ? 'bg-[var(--app-primary)]' : 'bg-[var(--app-primary)] hover:bg-[var(--app-secondary)]'
        }`}
      >
        {saving ? <Save size={20} className="animate-pulse" /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
        <span className="uppercase text-sm sm:text-base">{success ? 'SAQLANDI' : saving ? 'SAQLANMOQDA...' : "O'ZGARISHNI SAQLASH"}</span>
      </button>
    </div>
  );
}
