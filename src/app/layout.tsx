import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import './globals.css';
import ClientLayoutWrapper from './ClientLayoutWrapper';
import { AppProviders } from './providers';
import { getServerCenterBranding } from '@/lib/server-center-branding';
import { defaultLocale, defaultTimeZone } from '@/i18n/config';

// Fix Node 25 experimental localStorage issue
if (typeof window === 'undefined') {
  Reflect.deleteProperty(globalThis, 'localStorage');
  Reflect.deleteProperty(globalThis, 'sessionStorage');
}

import { generateSEO } from '@/lib/seo';
export const runtime = 'edge';

const isCapacitorExport = process.env.CAPACITOR_EXPORT === 'true';

async function getLayoutLocale() {
  if (isCapacitorExport) return defaultLocale;
  const { getLocale } = await import('next-intl/server');
  return getLocale();
}

async function getLayoutMessages() {
  if (isCapacitorExport) {
    return (await import(`../messages/${defaultLocale}.json`)).default;
  }

  const { getMessages } = await import('next-intl/server');
  return getMessages();
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb',
  colorScheme: 'light dark',
};

export async function generateMetadata(): Promise<Metadata> {
  const centerBranding = await getServerCenterBranding();

  return generateSEO(
    `${centerBranding.name} - Eng Zo'r Ingliz Tili Platformasi`,
    `${centerBranding.description} O'zbekiston bo'ylab noldan professional darajagacha ingliz tilini o'rganing.`,
    '',
    centerBranding.logoUrl,
    centerBranding.name,
    {
      keywords: [
        centerBranding.name,
        centerBranding.shortName,
        'ingliz tili kurslari',
        'online ingliz tili',
        'IELTS tayyorlov',
        'CEFR imtihoni',
        'english learning',
      ],
    },
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLayoutLocale();
  const messages = await getLayoutMessages();
  const centerBranding = await getServerCenterBranding();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full antialiased bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[var(--app-primary)] selection:text-white"
        suppressHydrationWarning
      >
        <AppProviders
          locale={locale}
          timeZone={defaultTimeZone}
          messages={messages}
          centerBranding={centerBranding}
        >
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AppProviders>
      </body>
    </html>
  );
}
