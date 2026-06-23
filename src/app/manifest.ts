import { MetadataRoute } from 'next';
import { getServerCenterBranding } from '@/lib/server-center-branding';

export const dynamic = 'force-static';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const centerBranding = await getServerCenterBranding();

  return {
    name: centerBranding.name,
    short_name: centerBranding.shortName,
    description: centerBranding.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: centerBranding.logoUrl,
        sizes: '192x192',
      },
      {
        src: centerBranding.logoUrl,
        sizes: '512x512',
      },
    ],
  };
}
