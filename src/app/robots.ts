import { MetadataRoute } from 'next';
import { PRIVATE_ROBOTS_PATHS, getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', ...PRIVATE_ROBOTS_PATHS],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
