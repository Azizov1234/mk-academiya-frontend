'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Search,
  ChevronUp,
  ChevronDown,
  Award,
  Percent,
  Hourglass,
  BookOpen,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getQuestionAnalytics,
  listTests,
  type QuestionAnalyticsItem,
  type TestItem
} from '@/lib/backend-api';
import { PageErrorState, PageShell } from '@/app/components/ui/PagePrimitives';

type SortField = 'questionText' | 'totalAttempts' | 'correctCount' | 'accuracyPercent' | 'avgTimeSeconds';
type SortOrder = 'asc' | 'desc';

export default function QuestionAnalyticsPage() {
  const [analytics, setAnalytics] = useState<QuestionAnalyticsItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalAttempts');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tests for the dropdown filter
      const testsRes = await listTests({ limit: 100 });
      setTests(testsRes.items || []);

      // Fetch analytics (filtered by test if selected)
      const testFilter = selectedTestId === 'all' ? undefined : selectedTestId;
      const analyticsRes = await getQuestionAnalytics(testFilter);
      setAnalytics(analyticsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tahliliy ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [selectedTestId]);

  // Calculations for summary cards
  const stats = useMemo(() => {
    if (analytics.length === 0) {
      return {
        avgAccuracy: 0,
        totalAttempts: 0,
        mostDifficult: 'N/A',
        mostDifficultId: null,
        mostDifficultAccuracy: 100
      };
    }

    let sumAccuracy = 0;
    let countWithAttempts = 0;
    let totalAttempts = 0;
    let minAccuracy = 100;
    let hardestQuestion = 'N/A';
    let hardestId: number | null = null;

    analytics.forEach((item) => {
      totalAttempts += item.totalAttempts;
      if (item.totalAttempts > 0) {
        sumAccuracy += item.accuracyPercent;
        countWithAttempts++;
        
        if (item.accuracyPercent < minAccuracy) {
          minAccuracy = item.accuracyPercent;
          hardestQuestion = item.questionText;
          hardestId = item.questionId;
        }
      }
    });

    return {
      avgAccuracy: countWithAttempts > 0 ? sumAccuracy / countWithAttempts : 0,
      totalAttempts,
      mostDifficult: hardestQuestion,
      mostDifficultId: hardestId,
      mostDifficultAccuracy: minAccuracy
    };
  }, [analytics]);

  // Filter and sort questions list
  const processedQuestions = useMemo(() => {
    let list = [...analytics];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.questionText.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [analytics, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleRow = (id: number) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  if (error) {
    return (
      <div className="app-page pb-nav-safe pt-4 sm:pt-6">
        <PageErrorState
          title="Analitika ma'lumotlarini yuklashda xato"
          description={error}
          retryLabel="Qayta yuklash"
          onRetry={() => void fetchData()}
        />
      </div>
    );
  }

  return (
    <PageShell title="Savollar Tahlili va Analitika" subtitle="Imtihon savollarining urinishlar soni, aniqligi va qiyinlik darajalari bo'yicha ko'rsatkichlar.">
      
      {/* Filters Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" size={18} />
          <input
            type="text"
            placeholder="Savol matni bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] outline-none transition focus:border-[var(--app-primary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-[var(--app-muted)]">Test turi:</label>
          <select
            value={selectedTestId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTestId(val === 'all' ? 'all' : Number(val));
            }}
            className="border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-bold text-[var(--app-text)] outline-none"
          >
            <option value="all">Barcha testlar</option>
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--app-primary)] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="app-card p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[var(--app-primary)] mb-4">
                <Percent size={20} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest">O'rtacha To'g'rilik</span>
              </div>
              <div>
                <p className="text-3xl font-black text-[var(--app-primary-dark)]">
                  {stats.avgAccuracy.toFixed(1)}%
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  To'g'ri topilgan javoblar nisbati
                </p>
              </div>
            </div>

            <div className="app-card p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[var(--app-secondary)] mb-4">
                <BookOpen size={20} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest">Jami Urinishlar</span>
              </div>
              <div>
                <p className="text-3xl font-black text-[var(--app-primary-dark)]">
                  {stats.totalAttempts}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                  Barcha savollarga urinishlar soni
                </p>
              </div>
            </div>

            <div className="app-card p-6 flex flex-col justify-between border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                <AlertCircle size={20} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest">Eng Qiyin Savol</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--app-primary-dark)] line-clamp-1">
                  {stats.mostDifficult}
                </p>
                <p className="mt-1 text-2xl font-black text-red-500">
                  {stats.mostDifficultAccuracy.toFixed(1)}% <span className="text-xs font-semibold text-[var(--app-muted)]">accuracy</span>
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="app-card overflow-hidden">
            {processedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <HelpCircle size={48} className="text-[var(--app-muted)] mb-3" />
                <h4 className="text-lg font-bold text-[var(--app-text)]">Hech qanday ma'lumot topilmadi</h4>
                <p className="text-sm text-[var(--app-muted)] mt-1">
                  Qidiruv so'rovingizni o'zgartirib ko'ring yoki boshqa testni tanlang.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)]">
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Savol Matni</th>
                      <th
                        onClick={() => handleSort('totalAttempts')}
                        className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] cursor-pointer hover:text-[var(--app-text)]"
                      >
                        <div className="flex items-center gap-1">
                          Jami Urinish
                          {sortField === 'totalAttempts' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('correctCount')}
                        className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] cursor-pointer hover:text-[var(--app-text)]"
                      >
                        <div className="flex items-center gap-1">
                          To'g'ri
                          {sortField === 'correctCount' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('accuracyPercent')}
                        className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] cursor-pointer hover:text-[var(--app-text)]"
                      >
                        <div className="flex items-center gap-1">
                          Aniqlik (%)
                          {sortField === 'accuracyPercent' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('avgTimeSeconds')}
                        className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] cursor-pointer hover:text-[var(--app-text)]"
                      >
                        <div className="flex items-center gap-1">
                          O'rt. Vaqt
                          {sortField === 'avgTimeSeconds' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--app-border)]">
                    {processedQuestions.map((question) => {
                      const isExpanded = expandedQuestionId === question.questionId;
                      let accuracyColor = 'text-[var(--app-primary)]';
                      if (question.totalAttempts > 0) {
                        if (question.accuracyPercent < 45) accuracyColor = 'text-red-500 font-bold';
                        else if (question.accuracyPercent < 75) accuracyColor = 'text-[var(--app-secondary)]';
                      }
                      
                      return (
                        <tr
                          key={question.questionId}
                          className={`transition-colors hover:bg-[color:color-mix(in_srgb,var(--app-secondary)_4%,transparent)] ${
                            isExpanded ? 'bg-[color:color-mix(in_srgb,var(--app-secondary)_6%,transparent)]' : ''
                          }`}
                        >
                          <td className="p-4 max-w-md">
                            <div>
                              <p className="font-bold text-[var(--app-text)] line-clamp-2">{question.questionText}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--app-muted)]">
                                  ID: {question.questionId}
                                </span>
                                <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--app-primary)]">
                                  {question.type}
                                </span>
                                {question.skill && (
                                  <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--app-secondary)]">
                                    {question.skill}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-black text-[var(--app-text)]">{question.totalAttempts}</td>
                          <td className="p-4 font-semibold text-[var(--app-text)] text-green-600">{question.correctCount}</td>
                          <td className="p-4">
                            {question.totalAttempts > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${accuracyColor}`}>
                                  {question.accuracyPercent}%
                                </span>
                                <div className="w-16 h-1.5 bg-[var(--app-border)] rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full ${
                                      question.accuracyPercent < 45 ? 'bg-red-500' : question.accuracyPercent < 75 ? 'bg-[var(--app-secondary)]' : 'bg-[var(--app-primary)]'
                                    }`}
                                    style={{ width: `${question.accuracyPercent}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-[var(--app-muted)]">-</span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-[var(--app-text)]">
                            {question.totalAttempts > 0 ? (
                              <div className="flex items-center gap-1">
                                <Hourglass size={12} className="text-[var(--app-muted)]" />
                                <span>{question.avgTimeSeconds.toFixed(1)}s</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-[var(--app-muted)]">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleRow(question.questionId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[var(--app-primary)] border border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-soft)] transition"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff size={12} />
                                  Yopish
                                </>
                              ) : (
                                <>
                                  <Eye size={12} />
                                  Batafsil
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
