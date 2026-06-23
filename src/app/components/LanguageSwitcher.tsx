'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { localeCookieName, locales, type AppLocale } from '@/i18n/config';
import { stripLocaleFromPathname } from '@/i18n/pathname';
import { cn } from '@/app/components/ui/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations('SettingsPage');
  const router = useRouter();
  const pathname = usePathname() || '/';
  const locale = useLocale() as AppLocale;

  const onChange = (nextLocale: string) => {
    const newLocale = nextLocale as AppLocale;
    const strippedPath = stripLocaleFromPathname(pathname);
    const query = typeof window !== 'undefined' ? window.location.search : '';
    const nextPath = `${strippedPath}${query}`;

    document.cookie = `${localeCookieName}=${newLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <label
      className={cn(
        'app-touch inline-flex min-h-10 min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold tracking-wide',
        className,
      )}
    >
      <Languages size={14} className="shrink-0" />
      <select
        aria-label={t('language')}
        className="min-h-8 min-w-0 flex-1 bg-transparent text-[11px] uppercase outline-none sm:text-xs"
        value={locale}
        onChange={(event) => onChange(event.target.value)}
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-white text-[var(--app-text)]">
            {t(`languages.${item}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
