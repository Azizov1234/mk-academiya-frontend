'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { localizePath } from '@/i18n/localizedPath';
import { getRoleHomePath } from '@/lib/role-access';

export default function HomeRouteGate() {
  const router = useRouter();
  const locale = useLocale();
  const { token, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && token) {
      router.replace(localizePath(locale, getRoleHomePath(role)));
    }
  }, [loading, locale, role, router, token]);

  return null;
}
