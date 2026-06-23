'use client';

import { useEffect, useMemo, useState } from 'react';
import { disableSecureScreen, enableSecureScreen } from '@/lib/screen-security';

interface UseExamSecurityOptions {
  enabled?: boolean;
  watermarkLabel?: string;
}

const EXAM_SECURITY_CLASS = 'exam-security-mode';

export function useExamSecurity({
  enabled = true,
  watermarkLabel = 'Protected exam',
}: UseExamSecurityOptions = {}) {
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const watermarkText = useMemo(() => {
    const timestamp = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    return `${watermarkLabel} | ${timestamp}`;
  }, [watermarkLabel]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void enableSecureScreen();

    document.body.classList.add(EXAM_SECURITY_CLASS);

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const handleVisibilityChange = () => {
      setPrivacyVisible(document.hidden);
    };

    const handleWindowBlur = () => {
      setPrivacyVisible(true);
    };

    const handleWindowFocus = () => {
      setPrivacyVisible(document.hidden);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && ['c', 'p', 's', 'u', 'x'].includes(key)) {
        event.preventDefault();
      }

      if (key === 'printscreen') {
        event.preventDefault();
        setPrivacyVisible(true);
        window.setTimeout(() => {
          setPrivacyVisible(false);
        }, 1200);
      }
    };

    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove(EXAM_SECURITY_CLASS);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      setPrivacyVisible(false);
      void disableSecureScreen();
    };
  }, [enabled]);

  return {
    privacyVisible,
    watermarkText,
  };
}
