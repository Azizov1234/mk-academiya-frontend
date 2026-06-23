import { Metadata } from 'next';
import GroupDetailClient from './GroupDetailClient';
import { generateSEO } from '@/lib/seo';
import { getServerCenterBranding } from '@/lib/server-center-branding';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const centerBranding = await getServerCenterBranding();

  return generateSEO(
    `Guruh tafsilotlari | ${centerBranding.name}`,
    centerBranding.description,
    `/groups/${id}`,
    centerBranding.logoUrl,
    centerBranding.name,
    { noIndex: true },
  );
}

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default async function GroupDetailPage({ params }: Props) {
  await params;
  return <GroupDetailClient />;
}
