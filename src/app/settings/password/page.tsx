'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Save } from 'lucide-react';
import { updateCurrentProfile } from '@/lib/backend-api';
import { PageShell } from '@/app/components/ui/PagePrimitives';
import { NoticeBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from '@/app/components/ui/DataDisplay';

export default function PasswordSettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave() {
    if (password.length < 8) {
      setNotice("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (password !== confirmPassword) {
      setNotice('Parollar bir xil emas');
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      await updateCurrentProfile({ passwordHash: password });
      setPassword('');
      setConfirmPassword('');
      setNotice('Parol yangilandi');
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Parol saqlanmadi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Parolni o'zgartirish"
      subtitle="Yangi parol serverda hash qilinadi"
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
            <KeyRound size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-base font-black text-[var(--app-text)]">Yangi parol</h2>
            <p className="text-xs font-semibold text-[var(--app-muted)]">Kamida 8 belgi kiriting.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
            placeholder="Yangi parol"
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={fieldClass}
            placeholder="Parolni takrorlang"
            autoComplete="new-password"
          />
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving || !password || !confirmPassword}
          className={`${primaryButtonClass} mt-4 w-full`}
        >
          <Save size={14} />
          {saving ? 'Saqlanmoqda' : 'Saqlash'}
        </button>
      </div>
    </PageShell>
  );
}
