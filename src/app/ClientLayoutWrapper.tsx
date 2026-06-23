'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { GlobalApiNotice } from './components/GlobalApiNotice';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { stripLocaleFromPathname } from '@/i18n/pathname';
import { localizePath } from '@/i18n/localizedPath';
import { getRoleHomePath, isRoleAllowedForPath } from '@/lib/role-access';
import { isNativeApp } from '@/lib/native-app';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { role, loading, token } = useAuth();
  const [nativeApp, setNativeApp] = useState(false);
  const [navPortalReady, setNavPortalReady] = useState(false);

  useEffect(() => {
    setNativeApp(isNativeApp());
    setNavPortalReady(true);
  }, []);

  useEffect(() => {
    if (!nativeApp) {
      document.documentElement.removeAttribute('data-app-lite');
      return;
    }

    document.documentElement.setAttribute('data-app-lite', 'true');

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      }).catch(() => {
        // Native builds do not need the PWA worker. Ignore environments without SW access.
      });
    }
  }, [nativeApp]);

  const normalizedPath = stripLocaleFromPathname(pathname || '/');

  // Public routes that don't need auth
  const isPublicRoute = ['/', '/login', '/landing', '/public-exam', '/public-rating'].includes(normalizedPath);
  const isAuthorizedRoute = isPublicRoute || isRoleAllowedForPath(normalizedPath, role);

  useEffect(() => {
    if (!loading && !token && !isPublicRoute) {
      router.replace(localizePath(locale, '/'));
    }
  }, [loading, token, isPublicRoute, locale, router]);

  useEffect(() => {
    if (!loading && token && !isAuthorizedRoute) {
      router.replace(localizePath(locale, getRoleHomePath(role)));
    }
  }, [loading, token, isAuthorizedRoute, locale, role, router]);

  if (!loading && !isAuthorizedRoute) {
    return null;
  }

  const hideNav = isPublicRoute;
  const fixedNavigation =
    navPortalReady && !hideNav
      ? createPortal(
          <>
            <Sidebar role={role} />
            <BottomNav role={role} />
          </>,
          document.body,
        )
      : null;

  return (
    <div
      className="app-shell relative flex min-h-screen bg-[var(--app-bg)] overflow-x-clip"
    >
      {fixedNavigation}
      
      <div className={`flex-1 flex min-h-screen-safe flex-col ${!hideNav ? 'lg:pl-72' : ''}`}>
        {!hideNav && <Header role={role} />}
        <OfflineStatusBanner />
        <main className={`min-w-0 w-full flex-1 ${!hideNav ? 'mx-auto max-w-7xl pb-nav-safe pt-5 sm:pt-7 lg:pt-10' : ''}`}>
          {nativeApp ? (
            <div>{children}</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
      <GlobalApiNotice />
    </div>
  );
}
