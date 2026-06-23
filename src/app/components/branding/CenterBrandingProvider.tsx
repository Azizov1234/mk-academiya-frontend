'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  DEFAULT_CENTER_BRANDING,
  normalizeCenterBranding,
  type CenterBranding,
} from '@/lib/branding';

type CenterBrandingContextValue = {
  centerBranding: CenterBranding;
};

const CenterBrandingContext =
  createContext<CenterBrandingContextValue | null>(null);

export function CenterBrandingProvider({
  children,
  initialBranding,
}: {
  children: ReactNode;
  initialBranding?: CenterBranding;
}) {
  const centerBranding = useMemo(
    () => normalizeCenterBranding(initialBranding || DEFAULT_CENTER_BRANDING),
    [initialBranding],
  );

  const value = useMemo<CenterBrandingContextValue>(
    () => ({
      centerBranding,
    }),
    [centerBranding],
  );

  return (
    <CenterBrandingContext.Provider value={value}>
      {children}
    </CenterBrandingContext.Provider>
  );
}

export function useCenterBranding() {
  const context = useContext(CenterBrandingContext);

  if (!context) {
    throw new Error(
      'useCenterBranding must be used within CenterBrandingProvider',
    );
  }

  return context;
}
