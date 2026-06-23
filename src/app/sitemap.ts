import { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@/lib/api-url';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = 86400; // Har bir kunda bir marta yangilab turadi (build paytida)
const includeDynamicCourses = process.env.NEXT_PUBLIC_SITEMAP_INCLUDE_COURSES === 'true';

type CourseSitemapItem = {
  id?: string | number;
  _id?: string | number;
  updatedAt?: string;
  createdAt?: string;
  isActive?: boolean;
};

function absoluteUrl(siteUrl: string, pathname: string) {
  return pathname === '/' ? siteUrl : `${siteUrl}${pathname}`;
}

function extractCourses(payload: any): CourseSitemapItem[] {
  const candidates = [
    payload?.data?.items,
    payload?.data,
    payload?.items,
    payload,
  ];

  return candidates.find(Array.isArray) ?? [];
}

function getCourseId(course: CourseSitemapItem) {
  const id = course.id ?? course._id;

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  if (typeof id === 'string' && id.trim()) {
    return id.trim();
  }

  return null;
}

function getLastModified(course: CourseSitemapItem) {
  const value = course.updatedAt ?? course.createdAt;
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(siteUrl, '/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl(siteUrl, '/public-exam'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: absoluteUrl(siteUrl, '/public-rating'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  let courseRoutes: MetadataRoute.Sitemap = [];
  if (!includeDynamicCourses) {
    return staticRoutes;
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/courses`, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`Courses request failed with ${res.status}`);
    }

    const payload = await res.json();
    const courses = extractCourses(payload);

    courseRoutes = courses
      .filter((course) => course.isActive !== false)
      .flatMap((course) => {
        const id = getCourseId(course);

        if (!id) return [];

        return [
          {
            url: absoluteUrl(siteUrl, `/courses/${encodeURIComponent(id)}`),
            lastModified: getLastModified(course),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          },
        ];
      });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sitemap course fetch skipped:', err);
    }
  }

  return [...staticRoutes, ...courseRoutes];
}
