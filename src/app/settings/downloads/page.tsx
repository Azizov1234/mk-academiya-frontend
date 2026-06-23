'use client';

import { ArrowLeft, Download, ExternalLink, Github, RefreshCw, Smartphone, TabletSmartphone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { localizePath } from '@/i18n/localizedPath';
import { APP_DOWNLOADS } from '@/lib/app-downloads';
import { PageShell } from '@/app/components/ui/PagePrimitives';

const downloadItems = [
  {
    key: 'android',
    icon: Smartphone,
    fileName: APP_DOWNLOADS.android.fileName,
    url: APP_DOWNLOADS.android.url,
  },
  {
    key: 'ios',
    icon: TabletSmartphone,
    fileName: APP_DOWNLOADS.ios.fileName,
    url: APP_DOWNLOADS.ios.url,
    directUrl: APP_DOWNLOADS.ios.directUrl,
  },
] as const;

export default function DownloadsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('DownloadsPage');

  return (
    <PageShell
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <button
          onClick={() => router.push(localizePath(locale, '/settings'))}
          className="flex items-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-text)] transition-transform active:scale-95"
        >
          <ArrowLeft size={14} />
          {t('back')}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {downloadItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.key} className="app-card flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black tracking-tight text-[var(--app-text)]">
                    {t(`${item.key}.title`)}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                    {t(`${item.key}.description`)}
                  </p>
                </div>
              </div>

              <div className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  {t('fileLabel')}
                </p>
                <p className="mt-1 break-all text-sm font-extrabold text-[var(--app-text)]">
                  {item.fileName}
                </p>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 py-4 text-[11px] font-black uppercase tracking-widest text-white transition-transform active:scale-95"
              >
                <Download size={18} />
                {item.key === 'ios' ? t('install') : t('download')}
              </a>

              {item.key === 'ios' ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold leading-relaxed text-[var(--app-muted)]">
                    {t('ios.installNote')}
                  </p>
                  <a
                    href={item.directUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]"
                  >
                    {t('directDownload')}
                    <ExternalLink size={13} />
                  </a>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)]">
              <RefreshCw size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-[var(--app-text)]">
                {t('latestTitle')}
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
                {t('latestDescription')}
              </p>
            </div>
          </div>
          <a
            href={APP_DOWNLOADS.releaseUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--app-text)] transition-transform active:scale-95"
          >
            <Github size={16} />
            {t('release')}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </PageShell>
  );
}
