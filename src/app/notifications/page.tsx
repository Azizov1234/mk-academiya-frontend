'use client';

import { Bell, CheckCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageEmptyState, PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import { useNotifications } from '@/app/components/notifications/NotificationProvider';

export default function NotificationsPage() {
  const t = useTranslations('Notifications');
  const {
    items,
    unreadCount,
    loading,
    error,
    permission,
    refresh,
    markAsRead,
    markAllAsRead,
    removeItem,
    requestPermission,
    openNotification,
  } = useNotifications();

  if (loading) {
    return (
      <PageShell title={t('title')} subtitle={t('subtitle')}>
        <PageLoadingState title={t('loadingTitle')} description={t('loadingDescription')} />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title={t('title')} subtitle={t('subtitle')}>
        <PageErrorState title={t('errorTitle')} description={error} retryLabel={t('retry')} onRetry={() => void refresh()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t('title')}
      subtitle={t('subtitleWithCount', { count: unreadCount })}
      action={
        <button
          onClick={() => void markAllAsRead()}
          className="rounded-[14px] bg-[var(--app-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
        >
          {t('markAll')}
        </button>
      }
    >
      {permission !== 'granted' ? (
        <div className="mb-4 flex items-start gap-3 rounded-[20px] border border-amber-100 bg-amber-50 p-4 text-amber-900">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{t('permissionTitle')}</p>
            <p className="mt-1 text-sm font-semibold text-amber-800">{t('permissionDescription')}</p>
          </div>
          <button
            onClick={() => void requestPermission()}
            className="shrink-0 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700"
          >
            {t('enable')}
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <PageEmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="grid gap-3 pb-20">
          {items.map((item) => (
            <div
              key={item.id}
              className={`app-card p-4 sm:p-5 ${
                item.isRead ? '' : 'border-[color:color-mix(in_srgb,var(--app-primary)_18%,var(--app-border))] bg-[var(--app-surface-soft)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => void openNotification(item)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-start gap-3">
                    <div className="rounded-[14px] bg-[color:color-mix(in_srgb,var(--app-primary)_12%,transparent)] p-3 text-[var(--app-primary)]">
                      <Bell size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black tracking-tight text-[var(--app-text)]">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-muted)]">{item.body}</p>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
                {!item.isRead ? <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--app-primary)]" /> : null}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {!item.isRead ? (
                  <button
                    onClick={() => void markAsRead(item.id)}
                    className="flex items-center justify-center gap-2 rounded-[14px] bg-[var(--app-primary)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    <CheckCheck size={14} />
                    {t('markRead')}
                  </button>
                ) : null}
                <button
                  onClick={() => void removeItem(item.id)}
                  className="flex items-center justify-center gap-2 rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600"
                >
                  <Trash2 size={14} />
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
