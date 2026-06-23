'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/app/components/ui/PagePrimitives';
import { NoticeBanner, secondaryButtonClass } from '@/app/components/ui/DataDisplay';

export default function TwoFactorSettingsPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(
    "2FA backend endpointi hali mavjud emas. Sahifa endi broken route emas, lekin toggle serverga ulanmaguncha faqat status ko'rsatadi.",
  );

  return (
    <PageShell
      title="Two-factor authentication"
      subtitle="Hisob xavfsizligi statusi"
      action={
        <button onClick={() => router.push('/settings')} className={secondaryButtonClass}>
          <ArrowLeft size={14} />
          Sozlamalar
        </button>
      }
    >
      <NoticeBanner message={notice} />
      <div className="app-card mx-auto max-w-xl p-5 text-center sm:p-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
          <ShieldCheck size={30} strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 text-lg font-black text-[var(--app-text)]">2FA hozircha ulanmagan</h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
          Backendda 2FA enrollment/verification endpointlari qo'shilgandan keyin bu yerda QR va recovery code oqimi ochiladi.
        </p>
        <button onClick={() => setNotice('2FA uchun backend endpoint kerak')} className={`${secondaryButtonClass} mt-6`}>
          Statusni tekshirish
        </button>
      </div>
    </PageShell>
  );
}
