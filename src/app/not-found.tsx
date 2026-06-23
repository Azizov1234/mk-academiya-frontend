import Link from 'next/link';
import { defaultLocale, type AppLocale } from '@/i18n/config';

const NOT_FOUND_COPY: Record<AppLocale, { title: string; description: string; action: string }> = {
  uz: {
    title: 'Sahifa topilmadi',
    description: "Qidirayotgan sahifangiz mavjud emas yoki boshqa manzilga ko'chirilgan.",
    action: 'Bosh sahifaga qaytish',
  },
  en: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist or has been moved.',
    action: 'Return home',
  },
  ru: {
    title: 'Stranitsa ne naydena',
    description: 'Zaprashivaemaya stranitsa ne sushchestvuet ili byla perenesena.',
    action: 'Vernutsya na glavnuyu',
  },
};

export default async function NotFound() {
  const copy = NOT_FOUND_COPY[defaultLocale] ?? NOT_FOUND_COPY.uz;

  return (
    <div className="min-h-screen-safe flex items-center justify-center bg-[var(--app-bg)] px-6 text-center">
      <div className="max-w-md border border-[var(--app-border)] bg-[var(--app-surface)] p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[var(--app-primary)]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--app-text)]">
          {copy.title}
        </h1>
        <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--app-muted)]">
          {copy.description}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex bg-[var(--app-primary)] px-6 py-3 text-sm font-black text-[var(--primary-foreground)] transition-transform active:scale-95"
        >
          {copy.action}
        </Link>
      </div>
    </div>
  );
}
