"use client";

import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  PlusCircle,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CEFR_LEVELS,
  createBook,
  listBooks,
  type CefrLevel,
} from "@/lib/backend-api";
import { useAuth } from "@/hooks/useAuth";
import { hasRoleCapability } from "@/lib/role-access";
import { PageLoadingState, PageShell } from "@/app/components/ui/PagePrimitives";
import {
  Badge,
  CompactStat,
  EmptyBlock,
  NoticeBanner,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/app/components/ui/DataDisplay";

const EMPTY_BOOK_FORM = {
  title: "",
  author: "",
  description: "",
  cefrLevel: "" as CefrLevel | "",
  coverImage: null as File | null,
  bookFile: null as File | null,
};

const fallbackCover =
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80";

const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BOOK_FILE_BYTES = 500 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileSizeError(file: File | null, maxBytes: number, label: string) {
  if (!file || file.size <= maxBytes) return null;

  return `${label} hajmi ${formatFileSize(maxBytes)} dan oshmasligi kerak. Tanlangan fayl: ${formatFileSize(file.size)}.`;
}

export default function Books() {
  const { role } = useAuth();
  const canManageBooks = hasRoleCapability(role, "manage_books");
  const [activeLevel, setActiveLevel] = useState<CefrLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_BOOK_FORM);

  const levels = useMemo(
    () => [
      { id: "all" as const, name: "Barchasi" },
      ...CEFR_LEVELS.map((level) => ({ id: level, name: level })),
    ],
    [],
  );

  const stats = useMemo(
    () => [
      { label: "Kitoblar", value: books.length, icon: BookOpen, tone: "primary" as const },
      {
        label: "Level filter",
        value: activeLevel === "all" ? "All" : activeLevel,
        icon: FileText,
        tone: "success" as const,
      },
      {
        label: "Mualliflar",
        value: new Set(books.map((book) => book?.author).filter(Boolean)).size,
        icon: BookOpen,
        tone: "warning" as const,
      },
    ],
    [activeLevel, books],
  );

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBooks({
        search,
        cefrLevel: activeLevel === "all" ? "" : activeLevel,
        isActive: true,
        limit: 100,
      });
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [activeLevel, search]);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  async function handleCreateBook() {
    if (!form.title.trim()) {
      setMutationError("Kitob nomini kiriting");
      return;
    }

    if (!form.bookFile) {
      setMutationError("Kitob faylini tanlang");
      return;
    }

    const coverSizeError = getFileSizeError(form.coverImage, MAX_COVER_IMAGE_BYTES, "Cover image");
    if (coverSizeError) {
      setMutationError(coverSizeError);
      return;
    }

    const bookSizeError = getFileSizeError(form.bookFile, MAX_BOOK_FILE_BYTES, "Kitob fayli");
    if (bookSizeError) {
      setMutationError(bookSizeError);
      return;
    }

    try {
      setCreating(true);
      setMutationError(null);
      await createBook({
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        description: form.description.trim() || undefined,
        cefrLevel: form.cefrLevel || undefined,
        coverImage: form.coverImage,
        bookFile: form.bookFile,
      });
      setCreateOpen(false);
      setForm(EMPTY_BOOK_FORM);
      await fetchBooks();
    } catch (bookError) {
      if (typeof bookError === "object" && bookError && "status" in bookError && bookError.status === 413) {
        setMutationError("Fayl server limiti uchun juda katta. Iltimos, kichikroq PDF/DOC yuklang yoki faylni siqing.");
        return;
      }

      setMutationError(
        bookError instanceof Error
          ? bookError.message
          : "Kitobni qo'shib bo'lmadi",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell
      title="Kutubxona"
      subtitle="Kitoblarni level bo'yicha toping va o'qishni davom ettiring"
      action={
        canManageBooks ? (
          <button
            onClick={() => {
              setMutationError(null);
              setCreateOpen(true);
            }}
            className={primaryButtonClass}
          >
            <PlusCircle size={15} strokeWidth={2.5} />
            Kitob qo'shish
          </button>
        ) : null
      }
    >
      <NoticeBanner message={createOpen ? null : mutationError} tone="danger" />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <CompactStat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={18}
              strokeWidth={2.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kitob nomi yoki muallif bo'yicha qidirish"
              className={`${fieldClass} pl-10`}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                className={`min-h-11 whitespace-nowrap rounded-lg border px-4 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  activeLevel === level.id
                    ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                    : "border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:border-[var(--app-primary)]/40 hover:text-[var(--app-primary)]"
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoadingState title="Kitoblar yuklanmoqda" description="Kutubxona katalogi olinmoqda" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="app-card group flex min-h-0 flex-col overflow-hidden"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--app-surface-soft)]">
                <img
                  src={book.coverImageUrl || fallbackCover}
                  alt={book.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  {book.cefrLevel ? <Badge tone="primary">{book.cefrLevel}</Badge> : null}
                  <Badge tone="muted">PDF</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                    <ExternalLink size={12} strokeWidth={3} />
                    O'qish
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-sm font-black leading-snug text-[var(--app-text)] group-hover:text-[var(--app-primary)]">
                  {book.title}
                </h3>
                <p className="mt-2 truncate text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  {book.author || "MK Academy"}
                </p>
                {book.description ? (
                  <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-[var(--app-muted)]">
                    {book.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    Reader
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)] transition-all group-hover:border-[var(--app-primary)] group-hover:bg-[var(--app-primary)] group-hover:text-white">
                    <ExternalLink size={15} strokeWidth={2.5} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {books.length === 0 ? (
            <EmptyBlock
              className="col-span-full"
              title="Hozircha kitoblar mavjud emas"
              description="Qidiruvni tozalang yoki boshqa CEFR level tanlab ko'ring."
              icon={BookOpen}
            />
          ) : null}
        </div>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--app-primary)]/20 px-3 backdrop-blur-md sm:items-center sm:px-4">
          <div className="animate-scale-in w-full max-w-lg rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">
                  Yangi kitob
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  PDF/DOC fayl majburiy
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  setMutationError(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition-all hover:text-[var(--app-primary)] active:scale-95"
                aria-label="Modalni yopish"
                title="Yopish"
              >
                <X size={18} />
              </button>
            </div>

            <NoticeBanner message={mutationError} tone="danger" />

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Kitob nomi"
                className={fieldClass}
              />
              <input
                value={form.author}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    author: event.target.value,
                  }))
                }
                placeholder="Muallif"
                className={fieldClass}
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Qisqa tavsif"
                className={textareaClass}
              />
              <select
                value={form.cefrLevel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cefrLevel: event.target.value as CefrLevel | "",
                  }))
                }
                className={fieldClass}
              >
                <option value="">CEFR level tanlang</option>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-sm font-bold text-[var(--app-muted)] transition-all hover:border-[var(--app-primary)]/40">
                <Upload size={16} className="text-[var(--app-primary)]" />
                <span className="min-w-0 flex-1 truncate">
                  {form.coverImage?.name || "Cover image tanlash"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    const sizeError = getFileSizeError(file, MAX_COVER_IMAGE_BYTES, "Cover image");
                    if (sizeError) {
                      event.target.value = "";
                      setMutationError(sizeError);
                      setForm((current) => ({ ...current, coverImage: null }));
                      return;
                    }

                    setMutationError(null);
                    setForm((current) => ({
                      ...current,
                      coverImage: file,
                    }));
                  }}
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[var(--app-primary)]/35 bg-[color:color-mix(in_srgb,var(--app-primary)_6%,var(--app-surface))] px-4 py-3 text-sm font-bold text-[var(--app-text)] transition-all hover:border-[var(--app-primary)]/55">
                <Upload size={16} className="text-[var(--app-primary)]" />
                <span className="min-w-0 flex-1 truncate">
                  {form.bookFile?.name || "Kitob faylini tanlash"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    const sizeError = getFileSizeError(file, MAX_BOOK_FILE_BYTES, "Kitob fayli");
                    if (sizeError) {
                      event.target.value = "";
                      setMutationError(sizeError);
                      setForm((current) => ({ ...current, bookFile: null }));
                      return;
                    }

                    setMutationError(null);
                    setForm((current) => ({
                      ...current,
                      bookFile: file,
                    }));
                  }}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  setCreateOpen(false);
                  setMutationError(null);
                }}
                className={secondaryButtonClass}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => void handleCreateBook()}
                disabled={creating}
                className={primaryButtonClass}
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
