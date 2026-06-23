'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import {
  type CefrLevel,
  CEFR_LEVELS,
  PUBLIC_EXAM_DIRECTIONS,
  PUBLIC_EXAM_MODES,
  getPublicExamRatings,
  type PublicExamDirection,
  type PublicExamMode,
  type PublicExamRatingItem,
} from '@/lib/backend-api';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function PublicRatingPage() {
  const [mode, setMode] = useState<PublicExamMode>('LEVEL');
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [direction, setDirection] = useState<PublicExamDirection>('VOCABULARY');
  const [items, setItems] = useState<PublicExamRatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPublicExamRatings({
          mode,
          level: mode === 'LEVEL' ? level : '',
          direction: mode === 'TRACK' ? direction : '',
          limit: 200,
        });
        setItems(response.items || []);
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Failed to load rating list'));
      } finally {
        setLoading(false);
      }
    };

    void fetchRatings();
  }, [direction, level, mode]);

  return (
    <div className="app-page pb-16 pt-6 sm:pt-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/public-exam"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)]"
        >
          <ArrowLeft size={16} />
          Back to exam
        </Link>
      </div>

      <section className="app-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <Trophy className="text-[var(--app-primary)]" size={24} />
          <h1 className="text-2xl font-black text-[var(--app-text)] sm:text-3xl">Global Rating</h1>
        </div>
        <p className="mt-2 text-sm font-medium text-[var(--app-muted)]">
          Ranking based on participant name entered before starting the exam.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-[var(--app-text)]">
            Mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as PublicExamMode)}
              className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
            >
              {PUBLIC_EXAM_MODES.map((item) => (
                <option key={item} value={item}>
                  {item === 'LEVEL' ? 'Level-based' : 'Track-based'}
                </option>
              ))}
            </select>
          </label>

          {mode === 'LEVEL' ? (
            <label className="text-sm font-semibold text-[var(--app-text)]">
              Level
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value as CefrLevel)}
                className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
              >
                {CEFR_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-sm font-semibold text-[var(--app-text)]">
              Direction
              <select
                value={direction}
                onChange={(event) => setDirection(event.target.value as PublicExamDirection)}
                className="mt-2 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] outline-none"
              >
                {PUBLIC_EXAM_DIRECTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" />
            Loading rating...
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm font-semibold text-red-600">{error}</p> : null}

        {!loading && !error ? (
          items.length === 0 ? (
            <p className="mt-6 text-sm font-semibold text-[var(--app-muted)]">
              No rating entries found for this filter.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border border-[var(--app-border)] bg-[var(--app-surface)]">
                <thead>
                  <tr className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] text-left text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Test</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={`${item.rank}-${item.participantName}-${item.testId || item.testTitle || 'test'}`}
                      className="border-b border-[var(--app-border)] text-sm font-semibold text-[var(--app-text)]"
                    >
                      <td className="px-4 py-3 font-black">#{item.rank}</td>
                      <td className="px-4 py-3">{item.participantName}</td>
                      <td className="px-4 py-3">{item.level || '-'}</td>
                      <td className="px-4 py-3">
                        {item.score}/{item.maxScore} ({Math.round(item.percentage)}%)
                      </td>
                      <td className="px-4 py-3">{item.testTitle || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}
