'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Brain, Check, Lock, PlusCircle, Search, Volume2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { listVocabularies } from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import {
  Badge,
  CompactStat,
  EmptyBlock,
  fieldClass,
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/app/components/ui/DataDisplay';

type VocabularyWord = {
  id: number;
  en: string;
  uz: string;
  type: string;
  pronunciation?: string;
  audioUrl?: string;
};

export default function VocabularyClient() {
  const router = useRouter();
  const { id } = useParams();
  const { role, loading: authLoading } = useAuth();
  const [playing, setPlaying] = useState<number | null>(null);
  const [loadingWords, setLoadingWords] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const favoritesKey = `mk-academy:vocabulary:favorites:${String(id)}`;

  useEffect(() => {
    let active = true;

    const fetchWords = async () => {
      try {
        setLoadingWords(true);
        const payload = await listVocabularies({ limit: 100 });

        if (!active) return;

        setWords(
          Array.isArray(payload)
            ? payload.map((item: any) => ({
                id: item.id,
                en: item.word,
                uz: item.translation,
                pronunciation: item.pronunciation,
                audioUrl: item.audioUrl,
                type: item.partOfSpeech ?? 'word',
              }))
            : [],
        );
        setError(null);
      } catch (loadError) {
        if (active) {
          setWords([]);
          setError(loadError instanceof Error ? loadError.message : "Vocabulary yuklanmadi");
        }
      } finally {
        if (active) {
          setLoadingWords(false);
        }
      }
    };

    void fetchWords();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(favoritesKey);
      setFavorites(stored ? JSON.parse(stored) : []);
    } catch {
      setFavorites([]);
    }
  }, [favoritesKey]);

  const filteredWords = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return words;

    return words.filter((word) =>
      `${word.en} ${word.uz} ${word.pronunciation || ''}`.toLowerCase().includes(normalized),
    );
  }, [searchTerm, words]);

  const stats = useMemo(
    () => [
      { label: "Jami so'z", value: words.length, icon: BookOpen, tone: "primary" as const },
      { label: "Ko'rinmoqda", value: filteredWords.length, icon: Search, tone: "success" as const },
      {
        label: "Talaffuz",
        value: words.filter((word) => Boolean(word.pronunciation)).length,
        icon: Volume2,
        tone: "warning" as const,
      },
    ],
    [filteredWords.length, words],
  );

  const toggleFavorite = (wordId: number) => {
    setFavorites((current) => {
      const next = current.includes(wordId)
        ? current.filter((id) => id !== wordId)
        : [...current, wordId];
      window.localStorage.setItem(favoritesKey, JSON.stringify(next));
      return next;
    });
  };

  const handlePlay = (word: VocabularyWord) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      void audio.play().catch(() => undefined);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.en);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    const wordId = word.id;
    setPlaying(wordId);
    window.setTimeout(() => setPlaying(null), 900);
  };

  if (authLoading || loadingWords) {
    return (
      <PageShell title="Vocabulary" subtitle="So'zlar yuklanmoqda">
        <PageLoadingState title="Vocabulary yuklanmoqda" description="Unit uchun so'zlar olinmoqda" />
      </PageShell>
    );
  }

  if (role !== 'student') {
    return (
      <PageShell title="Vocabulary" subtitle="Faqat student akkauntlari uchun">
        <div className="app-card mx-auto flex max-w-xl flex-col items-center px-6 py-10 text-center">
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-rose-600">
            <Lock size={34} strokeWidth={2.5} />
          </div>
          <h2 className="mt-5 text-xl font-black tracking-tight text-[var(--app-text)]">Ruxsat taqiqlangan</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted)]">
            Leksika va darsliklar student hisobiga ega foydalanuvchilar uchun mo'ljallangan.
          </p>
          <button onClick={() => router.push('/')} className={`${primaryButtonClass} mt-6`}>
            <ArrowLeft size={15} />
            Portalga qaytish
          </button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Vocabulary" subtitle="Xatolik">
        <PageErrorState
          title="Vocabulary yuklanmadi"
          description={error}
          retryLabel="Qayta urinish"
          onRetry={() => window.location.reload()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Unit ${id} vocabulary`}
      subtitle="So'zlarni qidiring, eshiting va takrorlashga o'ting"
      action={
        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.back()} className={secondaryButtonClass}>
            <ArrowLeft size={14} />
            Orqaga
          </button>
          <Link href="/vocabulary-practice" className={primaryButtonClass}>
            <Brain size={14} />
            Practice
          </Link>
        </div>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <CompactStat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
        <div className="relative">
          <Search
            size={18}
            strokeWidth={2.5}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
          />
          <input
            type="text"
            placeholder="So'z yoki tarjima bo'yicha qidirish"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pb-12 md:grid-cols-2">
        {filteredWords.length > 0 ? (
          filteredWords.map((word) => (
            <article
              key={word.id}
              className="group rounded-lg border border-[var(--app-border)] bg-white p-4 transition-all hover:border-[var(--app-primary)]/40 hover:shadow-[var(--shadow-premium)]"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePlay(word);
                  }}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95 ${
                    playing === word.id
                      ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                      : 'border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-primary)] group-hover:border-[var(--app-primary)]/40'
                  }`}
                  title="Talaffuz"
                  aria-label="So'z talaffuzini eshitish"
                >
                  <Volume2 size={22} strokeWidth={2.5} className={playing === word.id ? 'animate-pulse' : ''} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{word.type}</Badge>
                    {word.pronunciation ? <Badge tone="muted">{word.pronunciation}</Badge> : null}
                    {favorites.includes(word.id) ? <Badge tone="success">Saved</Badge> : null}
                  </div>
                  <h3 className="truncate text-lg font-black tracking-tight text-[var(--app-text)]">{word.en}</h3>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--app-muted)]">{word.uz}</p>
                </div>

                <button
                  className={iconButtonClass}
                  onClick={() => toggleFavorite(word.id)}
                  title="Local listga saqlash"
                  aria-label="So'zni local listga saqlash"
                >
                  {favorites.includes(word.id) ? (
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    <PlusCircle size={18} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyBlock
            className="md:col-span-2"
            title="Vocabulary topilmadi"
            description="Bu unit uchun hozircha so'z yo'q yoki qidiruv natija bermadi."
          />
        )}
      </div>
    </PageShell>
  );
}
