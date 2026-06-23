import { Metadata } from 'next';
import CourseDetailClient from './CourseDetailClient';
import { generateSEO } from '@/lib/seo';
import { getServerCenterBranding } from '@/lib/server-center-branding';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const centerBranding = await getServerCenterBranding();

  return generateSEO(
    `Kurs tafsilotlari | ${centerBranding.name}`,
    `${centerBranding.description} Kurs tafsilotlari va o'quv jarayoni.`,
    `/courses/${id}`,
    centerBranding.logoUrl,
    centerBranding.name,
    {
      keywords: [
        centerBranding.name,
        centerBranding.shortName,
        'ingliz tili',
        'kurs',
        'CEFR',
      ],
    },
  );
}

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default async function CourseDetailPage({ params }: Props) {
  // Although CourseDetailClient uses useParams(), 
  // the Page component must satisfy Next.js 15 constraints.
  await params; 
  return <CourseDetailClient />;
}
