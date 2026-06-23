import type { CenterBranding } from '@/lib/branding';

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.mk-academia.uz';

const STATIC_BRAND_ALIASES = [
  'MK Academy',
  'mk academy',
  'mkacademy',
  'mk-academy',
  'MC Academy',
  'mc academy',
  'mcacademy',
  'mc-academy',
  'mcakademy',
];

const MULTILINGUAL_SEO_KEYWORDS = [
  'english learning platform',
  'english courses',
  'english school uzbekistan',
  'IELTS preparation',
  'CEFR english',
  'online english education',
  'ingliz tili kurslari',
  'ingliz tili markazi',
  "ingliz tili o'rganish",
  'IELTS tayyorlov',
  'online ingliz tili',
  'kursy angliyskogo yazyka',
  'angliyskiy yazyk',
  'tsentr angliyskogo yazyka',
  'podgotovka k IELTS',
  'onlayn obuchenie angliyskomu',
];

export const PRIVATE_ROBOTS_PATHS = [
  '/dashboard',
  '/login',
  '/notifications',
  '/users',
  '/system',
  '/settings',
  '/groups',
  '/results',
  '/learning',
  '/books',
  '/tasks',
  '/tests',
  '/unit',
  '/course',
  '/start',
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSiteInput(url: string) {
  const trimmedUrl = url.trim().replace(/^['"]|['"]$/g, '');

  if (!trimmedUrl) {
    return 'https://www.mk-academia.uz';
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl.replace(/^\/+/, '')}`;
}

export function getSiteUrl() {
  const configuredUrl = normalizeSiteInput(DEFAULT_SITE_URL);

  try {
    const url = new URL(configuredUrl);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return 'https://www.mk-academia.uz';
  }
}

export function getBrandKeywordVariants(brandName = 'MK Academy') {
  const normalized = brandName.trim() || 'MK Academy';
  const squashed = normalized.replace(/\s+/g, '');
  const hyphenated = normalized.replace(/\s+/g, '-');

  return unique([
    normalized,
    normalized.toLowerCase(),
    squashed,
    squashed.toLowerCase(),
    hyphenated,
    hyphenated.toLowerCase(),
    ...STATIC_BRAND_ALIASES,
  ]);
}

export function getSeoKeywords(brandName = 'MK Academy', extra: string[] = []) {
  return unique([
    ...getBrandKeywordVariants(brandName),
    ...MULTILINGUAL_SEO_KEYWORDS,
    ...extra,
  ]);
}

export function getPublicStructuredData(centerBranding: CenterBranding) {
  const siteUrl = getSiteUrl();
  const alternateName = getBrandKeywordVariants(centerBranding.name);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      '@id': `${siteUrl}#organization`,
      name: centerBranding.name,
      alternateName,
      description: centerBranding.description,
      url: siteUrl,
      logo: centerBranding.logoUrl,
      image: centerBranding.logoUrl,
      knowsLanguage: ['uz', 'ru', 'en'],
      areaServed: {
        '@type': 'Country',
        name: 'Uzbekistan',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: centerBranding.name,
      alternateName,
      description: centerBranding.description,
      inLanguage: ['uz', 'ru', 'en'],
      publisher: {
        '@id': `${siteUrl}#organization`,
      },
    },
  ];
}
