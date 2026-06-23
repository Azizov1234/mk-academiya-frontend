import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isVercelBuild = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isCapacitorExport = process.env.CAPACITOR_EXPORT === 'true' && !isVercelBuild;
const backendApiUrl = process.env.NEXT_SERVER_API_URL ?? 'https://api.mk-academia.uz';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development' || isCapacitorExport,
});

if (typeof window === 'undefined') {
  // @ts-ignore
  delete global.localStorage;
  // @ts-ignore
  delete global.sessionStorage;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isCapacitorExport ? { output: 'export' as const } : {}),
  ...(isCapacitorExport
    ? {}
    : {
        async rewrites() {
          return {
            beforeFiles: [
              {
                source: '/api/:path*',
                destination: `${backendApiUrl.replace(/\/+$/, '')}/api/:path*`,
              },
              {
                source: '/uploads/:path*',
                destination: `${backendApiUrl.replace(/\/+$/, '')}/uploads/:path*`,
              },
            ],
          };
        },
      }),
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_SKIP_INTERNAL_CHECKS === 'true',
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_SKIP_INTERNAL_CHECKS === 'true',
  },
  env: {
    NEXT_PUBLIC_DISABLE_LOCALE_PREFIX: isCapacitorExport ? 'true' : 'false',
    NEXT_PUBLIC_CAPACITOR_EXPORT: isCapacitorExport ? 'true' : 'false',
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    cpus: 1,
  },
};

export default withPWA(withNextIntl(nextConfig));
