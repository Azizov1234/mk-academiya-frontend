import { Metadata } from 'next';
import { getSeoKeywords, getSiteUrl } from '@/lib/site';

const DEFAULT_DESCRIPTION =
  "Ingliz tilini CEFR standarti bo'yicha noldan professional darajagacha o'rganing. Grammar, Vocabulary, Listening, Reading - hammasi bir joyda.";
const DEFAULT_LOGO =
  'https://res.cloudinary.com/dpfbu9aid/image/upload/v1775282809/academy_kaomaq.jpg';

type SEOOptions = {
  keywords?: string[];
  canonicalPath?: string;
  noIndex?: boolean;
};

export const generateSEO = (
  title?: string,
  description?: string,
  path: string = '',
  image?: string,
  brandName: string = 'MK Academy',
  options: SEOOptions = {},
): Metadata => {
  const appName = brandName || 'MK Academy';
  const defaultTitle = `${appName} | English Courses, IELTS & CEFR Learning Platform`;
  const fullTitle = title
    ? title.toLowerCase().includes(appName.toLowerCase())
      ? title
      : `${title} | ${appName}`
    : defaultTitle;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const url = getSiteUrl();
  const canonicalPath = options.canonicalPath ?? path;
  const canonicalUrl = `${url}${canonicalPath}`;
  const iconUrl = image || DEFAULT_LOGO;
  const keywords = getSeoKeywords(appName, options.keywords || []);

  return {
    metadataBase: new URL(url),
    title: fullTitle,
    description: fullDescription,
    applicationName: appName,
    authors: [{ name: `${appName} Team` }],
    generator: 'Next.js',
    keywords,
    referrer: 'origin-when-cross-origin',
    creator: appName,
    publisher: appName,
    robots: {
      index: !options.noIndex,
      follow: !options.noIndex,
      googleBot: {
        index: !options.noIndex,
        follow: !options.noIndex,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    icons: {
      icon: [{ url: iconUrl }],
      shortcut: iconUrl,
      apple: iconUrl,
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: canonicalUrl,
      siteName: appName,
      locale: 'uz_UZ',
      alternateLocale: ['ru_RU', 'en_US'],
      type: 'website',
      images: [
        {
          url: iconUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      creator: '@mkacademy',
      images: [iconUrl],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    category: 'education',
  };
};
