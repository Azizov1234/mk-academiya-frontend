'use client';

import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  Share2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getBookById } from '@/lib/backend-api';
import {
  Badge,
  EmptyBlock,
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/app/components/ui/DataDisplay';

const fallbackCover =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&q=80';

function getFileUrl(book: any) {
  return book?.fileUrl ?? book?.bookFileUrl ?? book?.file?.url ?? book?.documentUrl ?? '';
}

export default function BookViewerClient() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const bookId = Number(rawId);
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadBook() {
      if (!Number.isFinite(bookId)) {
        setError("Kitob ID noto'g'ri");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getBookById(bookId);
        if (active) setBook(data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Kitobni yuklab bo'lmadi");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBook();

    return () => {
      active = false;
    };
  }, [bookId]);

  const fileUrl = getFileUrl(book);
  const totalPages = useMemo(() => {
    const value = Number(book?.pages ?? book?.pageCount ?? 120);
    return Number.isFinite(value) && value > 0 ? value : 120;
  }, [book]);
  const progress = Math.round((page / totalPages) * 100);
  const title = book?.title ?? (Number.isFinite(bookId) ? `Kitob #${bookId}` : 'Kitob');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)] animate-fade-up">
      <header className="app-top-safe border-b border-[var(--app-border)] bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.back()}
              className={iconButtonClass}
              title="Orqaga"
              aria-label="Orqaga qaytish"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-[var(--app-text)] sm:text-base">
                {title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {book?.cefrLevel ? <Badge tone="primary">{book.cefrLevel}</Badge> : null}
                <span className="truncate text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  {book?.author || 'MK Academy'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button className={iconButtonClass} title="Bookmark" aria-label="Bookmark">
              <Bookmark size={17} strokeWidth={2.5} />
            </button>
            <button className={iconButtonClass} title="Ulashish" aria-label="Ulashish">
              <Share2 size={17} strokeWidth={2.5} />
            </button>
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className={iconButtonClass}
                title="Yangi oynada ochish"
                aria-label="Kitob faylini yangi oynada ochish"
              >
                <ExternalLink size={17} strokeWidth={2.5} />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden bg-[var(--app-surface-soft)] p-3 sm:p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="app-card flex items-center gap-3 px-5 py-4">
              <Loader2 className="animate-spin text-[var(--app-primary)]" size={22} />
              <span className="text-sm font-black text-[var(--app-text)]">Kitob yuklanmoqda</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <EmptyBlock title="Kitob yuklanmadi" description={error} icon={FileText} />
          </div>
        ) : fileUrl ? (
          <div className="h-full overflow-hidden rounded-lg border border-[var(--app-border)] bg-white shadow-[var(--shadow-premium)]">
            <iframe
              src={fileUrl}
              title={title}
              className="h-full w-full bg-white"
            />
          </div>
        ) : (
          <div className="mx-auto grid h-full max-w-6xl gap-5 overflow-auto lg:grid-cols-[0.8fr_1.2fr]">
            <div className="app-card overflow-hidden">
              <img
                src={book?.coverImageUrl || fallbackCover}
                alt={title}
                className="aspect-[3/4] h-full min-h-[420px] w-full object-cover"
              />
            </div>
            <div className="app-card flex flex-col justify-center p-6 sm:p-8">
              <Badge tone="warning">Preview</Badge>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--app-text)] sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-sm font-black uppercase tracking-widest text-[var(--app-muted)]">
                {book?.author || 'MK Academy'}
              </p>
              <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-[var(--app-muted)]">
                {book?.description ||
                  "Bu kitob uchun fayl linki hali backenddan kelmadi. Fayl biriktirilganda shu viewer ichida ochiladi."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => router.back()} className={secondaryButtonClass}>
                  <ChevronLeft size={14} />
                  Kutubxonaga qaytish
                </button>
                {book?.coverImageUrl ? (
                  <a href={book.coverImageUrl} target="_blank" rel="noreferrer" className={primaryButtonClass}>
                    <Maximize2 size={14} />
                    Cover ochish
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--app-border)] bg-white px-4 py-3 sm:px-6">
        {fileUrl ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[var(--app-muted)]">
              Fayl viewer ichida ochildi. PDF boshqaruvlari browser tomonidan ko'rsatiladi.
            </p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
              <ExternalLink size={14} />
              Yangi oynada ochish
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              className={secondaryButtonClass}
            >
              <ChevronLeft size={16} strokeWidth={3} />
              Oldingisi
            </button>
            <div className="min-w-[8rem] flex-1 text-center sm:max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--app-primary)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="mt-2 block text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                {progress}% o'qildi
              </span>
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className={primaryButtonClass}
            >
              Keyingisi
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
