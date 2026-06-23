'use client';

import { Bell, CheckCheck, ChevronRight, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNotifications } from './NotificationProvider';
import { localizePath } from '@/i18n/localizedPath';
import { Sheet, SheetContent } from '@/app/components/ui/sheet';

interface NotificationBellProps {
  className?: string;
}

type DesktopPanelStyle = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Notifications');
  const { items, unreadCount, markAllAsRead, removeItem, openNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [useSheetLayout, setUseSheetLayout] = useState(false);
  const [desktopPanelStyle, setDesktopPanelStyle] = useState<DesktopPanelStyle | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewItems = items.slice(0, 5);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const syncLayout = () => {
      setUseSheetLayout(media.matches);
    };

    syncLayout();
    media.addEventListener('change', syncLayout);

    return () => {
      media.removeEventListener('change', syncLayout);
    };
  }, []);

  useEffect(() => {
    if (!open || useSheetLayout) {
      return;
    }

    function updateDesktopPanelPosition() {
      const trigger = buttonRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalMargin = 12;
      const verticalMargin = 12;
      const preferredWidth = 352;
      const width = Math.min(preferredWidth, viewportWidth - horizontalMargin * 2);
      const maxPanelHeight = Math.max(
        180,
        Math.min(384, viewportHeight - verticalMargin * 2),
      );
      const top = Math.max(
        verticalMargin,
        Math.min(
          rect.bottom + 12,
          viewportHeight - maxPanelHeight - verticalMargin,
        ),
      );
      const left = Math.max(
        horizontalMargin,
        Math.min(
          rect.right - width,
          viewportWidth - width - horizontalMargin,
        ),
      );

      setDesktopPanelStyle({
        left,
        top,
        width,
        maxHeight: maxPanelHeight,
      });
    }

    function handleClickOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    updateDesktopPanelPosition();
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateDesktopPanelPosition);
    window.addEventListener('scroll', updateDesktopPanelPosition, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateDesktopPanelPosition);
      window.removeEventListener('scroll', updateDesktopPanelPosition, true);
    };
  }, [open, useSheetLayout]);

  const panelContent = (
    <>
      <div className="flex justify-center border-b border-[var(--app-border)] py-2 lg:hidden">
        <span className="h-1.5 w-12 bg-[var(--app-border)]" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight text-[var(--app-text)]">{t('title')}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
            {t('unreadCount', { count: unreadCount })}
          </p>
        </div>
        <button
          onClick={() => void markAllAsRead()}
          className="ml-3 shrink-0 border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]"
        >
          <span className="flex items-center gap-1">
            <CheckCheck size={12} />
            {t('markAll')}
          </span>
        </button>
      </div>

      {previewItems.length > 0 ? (
        <div className="flex-1 overflow-y-auto p-2 pb-3">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className={`border p-3 transition-colors ${
                item.isRead
                  ? 'border-[var(--app-border)] bg-white'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-soft)]'
              }`}
            >
              <button
                onClick={() => {
                  void openNotification(item);
                  setOpen(false);
                }}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black tracking-tight text-[var(--app-text)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-muted)]">
                      {item.body}
                    </p>
                  </div>
                  {!item.isRead ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-[var(--app-primary)]" />
                  ) : null}
                </div>
              </button>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <button
                  onClick={() => void removeItem(item.id)}
                  className="shrink-0 border border-red-200 bg-red-50 p-2 text-red-600"
                  aria-label={t('delete')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              router.push(localizePath(locale, '/notifications'));
              setOpen(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 border border-[var(--app-border)] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--app-primary)]"
          >
            {t('viewAll')}
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-sm font-black text-[var(--app-text)]">{t('emptyTitle')}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--app-muted)]">{t('emptyDescription')}</p>
        </div>
      )}
    </>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((current) => !current)}
        className="app-touch relative flex h-10 w-10 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-primary)] transition-all sm:h-11 sm:w-11"
        aria-label={t('title')}
      >
        <Bell size={18} strokeWidth={2.4} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 bg-[var(--app-primary)] px-1.5 py-0.5 text-center text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {useSheetLayout ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="z-[140] gap-0 border-[var(--app-border)] bg-[var(--app-surface)] p-0 [&>button]:hidden"
          >
            <div className="flex max-h-[min(72dvh,34rem)] flex-col">
              {panelContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : open ? (
        <div
          className="fixed z-[140]"
          style={{
            left: desktopPanelStyle?.left ?? 12,
            top: desktopPanelStyle?.top ?? 72,
            width: desktopPanelStyle?.width ?? 352,
          }}
        >
          <div
            className="flex flex-col overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)]"
            style={{
              maxHeight: desktopPanelStyle?.maxHeight ?? 384,
            }}
          >
            {panelContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
