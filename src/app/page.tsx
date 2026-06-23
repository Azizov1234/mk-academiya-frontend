import { Metadata } from 'next';
import { LandingPage } from './components/LandingPage';
import StructuredData from './components/SEO/StructuredData';
import HomeRouteGate from './HomeRouteGate';
import { generateSEO } from '@/lib/seo';
import { getServerCenterBranding } from '@/lib/server-center-branding';
import { getPublicStructuredData } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const centerBranding = await getServerCenterBranding();

  return generateSEO(
    `${centerBranding.name} | Ingliz tili kurslari, IELTS, CEFR`,
    `${centerBranding.description} ${centerBranding.name} o'zbek, rus va ingliz tillarida ta'lim tajribasini taklif qiladi. Zamonaviy metodika asosida dars qiling.`,
    '/',
    centerBranding.logoUrl,
    centerBranding.name,
    {
      keywords: [
        centerBranding.name,
        centerBranding.shortName,
        'ingliz tili o\'rganish',
        'IELTS tayyorlov onlayn',
        'CEFR kurslari',
        'english learning platform uzbekistan',
      ],
    },
  );
}

export default async function HomePage() {
  const centerBranding = await getServerCenterBranding();

  return (
    <>
      <StructuredData data={getPublicStructuredData(centerBranding)} />
      <HomeRouteGate />
      <LandingPage />
    </>
  );
}
