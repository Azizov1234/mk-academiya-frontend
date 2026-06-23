'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Edit3,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  addWordListItem,
  createVocabulary,
  createWordList,
  deleteVocabulary,
  deleteWordList,
  getDueVocabularyReviews,
  getVocabularyById,
  getVocabularyProgressById,
  getVocabularyProgressByStudent,
  getWordListById,
  listVocabularies,
  listWordListItems,
  listWordLists,
  removeWordListItem,
  updateVocabulary,
  updateWordList,
  type VocabularyPayload,
  type WordListPayload,
} from '@/lib/backend-api';
import { PageErrorState, PageLoadingState, PageShell } from '@/app/components/ui/PagePrimitives';
import {
  Badge,
  CompactStat,
  EmptyBlock,
  JsonBlock,
  NoticeBanner,
  SectionTitle,
  fieldClass,
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from '@/app/components/ui/DataDisplay';

type AnyRecord = Record<string, any>;

const emptyVocabularyForm = {
  word: '',
  translation: '',
  exampleSentence: '',
  difficulty: '1',
  courseId: '',
};

const emptyWordListForm = {
  title: '',
  name: '',
  studentId: '',
  description: '',
  isPublic: false,
};

function toNumberOrNull(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && value !== '' ? numberValue : null;
}

function getItemTitle(item: AnyRecord) {
  return item?.title ?? item?.name ?? item?.word ?? item?.vocabulary?.word ?? `#${item?.id ?? '-'}`;
}

function itemIncludes(item: AnyRecord, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;

  return [
    item?.id,
    item?.word,
    item?.translation,
    item?.title,
    item?.name,
    item?.description,
    item?.studentId,
    item?.vocabulary?.word,
    item?.vocabulary?.translation,
  ]
    .filter((value) => value !== undefined && value !== null)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export default function VocabularyAdminPage() {
  const [vocabularies, setVocabularies] = useState<AnyRecord[]>([]);
  const [wordLists, setWordLists] = useState<AnyRecord[]>([]);
  const [wordListItems, setWordListItems] = useState<AnyRecord[]>([]);
  const [dueReviews, setDueReviews] = useState<AnyRecord[]>([]);
  const [studentProgress, setStudentProgress] = useState<AnyRecord[]>([]);
  const [progressDetail, setProgressDetail] = useState<AnyRecord | null>(null);
  const [selectedVocabularyId, setSelectedVocabularyId] = useState<number | null>(null);
  const [selectedWordListId, setSelectedWordListId] = useState<number | null>(null);
  const [vocabularySearch, setVocabularySearch] = useState('');
  const [wordListSearch, setWordListSearch] = useState('');
  const [vocabularyForm, setVocabularyForm] = useState(emptyVocabularyForm);
  const [wordListForm, setWordListForm] = useState(emptyWordListForm);
  const [itemVocabularyId, setItemVocabularyId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [progressId, setProgressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      { label: 'Vocabulary', value: vocabularies.length, icon: BookOpen, tone: 'primary' as const },
      { label: 'Word lists', value: wordLists.length, icon: ClipboardList, tone: 'success' as const },
      { label: 'List items', value: wordListItems.length, icon: Layers3, tone: 'warning' as const },
      { label: 'Due reviews', value: dueReviews.length, icon: TrendingUp, tone: 'muted' as const },
    ],
    [dueReviews.length, vocabularies.length, wordListItems.length, wordLists.length],
  );

  const filteredVocabularies = useMemo(
    () => vocabularies.filter((item) => itemIncludes(item, vocabularySearch)),
    [vocabularies, vocabularySearch],
  );

  const filteredWordLists = useMemo(
    () => wordLists.filter((item) => itemIncludes(item, wordListSearch)),
    [wordLists, wordListSearch],
  );

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      setNotice(null);
      const [vocabularyRes, listRes, dueRes] = await Promise.allSettled([
        listVocabularies({ limit: 100 }),
        listWordLists(),
        getDueVocabularyReviews(),
      ]);
      if (vocabularyRes.status === 'fulfilled') setVocabularies(vocabularyRes.value);
      if (listRes.status === 'fulfilled') setWordLists(listRes.value);
      if (dueRes.status === 'fulfilled') setDueReviews(dueRes.value);
      const failedSections = [
        vocabularyRes.status === 'rejected' ? 'vocabulary' : null,
        listRes.status === 'rejected' ? 'word lists' : null,
        dueRes.status === 'rejected' ? 'due reviews' : null,
      ].filter(Boolean);
      if (failedSections.length) {
        setNotice(`${failedSections.join(', ')} yuklanmadi`);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vocabulary ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function buildVocabularyPayload(): VocabularyPayload {
    const courseId = toNumberOrNull(vocabularyForm.courseId);
    return {
      word: vocabularyForm.word,
      translation: vocabularyForm.translation,
      exampleSentence: vocabularyForm.exampleSentence || undefined,
      difficulty: Number(vocabularyForm.difficulty || 1),
      courseId,
    };
  }

  function buildWordListPayload(): WordListPayload {
    const student = toNumberOrNull(wordListForm.studentId);
    return {
      title: wordListForm.title || undefined,
      name: wordListForm.name || undefined,
      description: wordListForm.description || undefined,
      isPublic: wordListForm.isPublic,
      studentId: student ?? undefined,
    };
  }

  async function handleSaveVocabulary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = buildVocabularyPayload();
      if (selectedVocabularyId) {
        await updateVocabulary(selectedVocabularyId, payload);
        setNotice("Vocabulary yangilandi");
      } else {
        await createVocabulary(payload);
        setNotice("Vocabulary yaratildi");
      }
      setVocabularyForm(emptyVocabularyForm);
      setSelectedVocabularyId(null);
      setVocabularies(await listVocabularies({ limit: 100 }));
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Vocabulary saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function editVocabulary(id: number) {
    try {
      setSaving(true);
      const item = await getVocabularyById(id);
      setSelectedVocabularyId(id);
      setVocabularyForm({
        word: item?.word ?? '',
        translation: item?.translation ?? '',
        exampleSentence: item?.exampleSentence ?? '',
        difficulty: String(item?.difficulty ?? 1),
        courseId: item?.courseId ? String(item.courseId) : '',
      });
      setNotice("Vocabulary detali yuklandi");
    } catch (editError) {
      setNotice(editError instanceof Error ? editError.message : "Vocabulary topilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function removeVocabulary(id: number) {
    if (!window.confirm("Vocabulary o'chirishni tasdiqlaysizmi?")) return;

    try {
      setSaving(true);
      await deleteVocabulary(id);
      setVocabularies(await listVocabularies({ limit: 100 }));
      setNotice("Vocabulary o'chirildi");
    } catch (deleteError) {
      setNotice(deleteError instanceof Error ? deleteError.message : "Vocabulary o'chirilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWordList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = buildWordListPayload();
      if (selectedWordListId) {
        await updateWordList(selectedWordListId, payload);
        setNotice("Word list yangilandi");
      } else {
        await createWordList(payload);
        setNotice("Word list yaratildi");
      }
      setWordListForm(emptyWordListForm);
      setSelectedWordListId(null);
      setWordLists(await listWordLists());
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Word list saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function selectWordList(id: number) {
    try {
      setSaving(true);
      const [detail, items] = await Promise.all([getWordListById(id), listWordListItems(id)]);
      setSelectedWordListId(id);
      setWordListForm({
        title: detail?.title ?? '',
        name: detail?.name ?? '',
        studentId: detail?.studentId ? String(detail.studentId) : '',
        description: detail?.description ?? '',
        isPublic: Boolean(detail?.isPublic),
      });
      setWordListItems(items);
      setNotice("Word list detali yuklandi");
    } catch (selectError) {
      setNotice(selectError instanceof Error ? selectError.message : "Word list yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function removeWordList(id: number) {
    if (!window.confirm("Word list o'chirishni tasdiqlaysizmi?")) return;

    try {
      setSaving(true);
      await deleteWordList(id);
      setWordLists(await listWordLists());
      if (selectedWordListId === id) {
        setSelectedWordListId(null);
        setWordListItems([]);
        setWordListForm(emptyWordListForm);
      }
      setNotice("Word list o'chirildi");
    } catch (deleteError) {
      setNotice(deleteError instanceof Error ? deleteError.message : "Word list o'chirilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWordListId) return;
    try {
      setSaving(true);
      await addWordListItem(selectedWordListId, { vocabularyId: Number(itemVocabularyId) });
      setWordListItems(await listWordListItems(selectedWordListId));
      setItemVocabularyId('');
      setNotice("So'z listga qo'shildi");
    } catch (addError) {
      setNotice(addError instanceof Error ? addError.message : "So'z qo'shilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: AnyRecord) {
    if (!selectedWordListId) return;
    const vocabularyId = Number(item?.vocabularyId ?? item?.vocabulary?.id);
    if (!Number.isFinite(vocabularyId) || vocabularyId <= 0) {
      setNotice("Word list itemida vocabularyId topilmadi");
      return;
    }
    if (!window.confirm("So'zni listdan olib tashlashni tasdiqlaysizmi?")) return;

    try {
      setSaving(true);
      await removeWordListItem(selectedWordListId, vocabularyId);
      setWordListItems(await listWordListItems(selectedWordListId));
      setNotice("So'z listdan olib tashlandi");
    } catch (removeError) {
      setNotice(removeError instanceof Error ? removeError.message : "So'z olib tashlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function loadStudentProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setStudentProgress(await getVocabularyProgressByStudent(Number(studentId)));
      setNotice("Student progress yuklandi");
    } catch (progressError) {
      setNotice(progressError instanceof Error ? progressError.message : "Student progress yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function loadProgressDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setProgressDetail(await getVocabularyProgressById(Number(progressId)));
      setNotice("Progress detali yuklandi");
    } catch (progressError) {
      setNotice(progressError instanceof Error ? progressError.message : "Progress detali yuklanmadi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Vocabulary admin" subtitle="Vocabulary CRUD, word lists va progress">
        <PageLoadingState title="Vocabulary yuklanmoqda" description="Backenddagi lug'at ma'lumotlari olinmoqda" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Vocabulary admin" subtitle="Xatolik">
        <PageErrorState title="Ma'lumot yuklanmadi" description={error} retryLabel="Qayta urinish" onRetry={() => void loadData()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Vocabulary admin"
      subtitle="So'zlar, word-listlar va takrorlash progressi"
      action={
        <button onClick={() => void loadData()} className={secondaryButtonClass}>
          <RefreshCcw size={14} />
          Yangilash
        </button>
      }
    >
      <NoticeBanner message={notice} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <CompactStat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-5">
          <form onSubmit={handleSaveVocabulary} className="app-card p-5">
            <SectionTitle
              title={selectedVocabularyId ? 'Vocabulary tahrirlash' : 'Vocabulary yaratish'}
              description="Asosiy so'z, tarjima, misol gap va kurs bog'lanishini kiriting."
              icon={BookOpen}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={fieldClass}
                value={vocabularyForm.word}
                onChange={(event) => setVocabularyForm({ ...vocabularyForm, word: event.target.value })}
                placeholder="word"
                required
              />
              <input
                className={fieldClass}
                value={vocabularyForm.translation}
                onChange={(event) => setVocabularyForm({ ...vocabularyForm, translation: event.target.value })}
                placeholder="translation"
                required
              />
              <input
                className={fieldClass}
                type="number"
                value={vocabularyForm.difficulty}
                onChange={(event) => setVocabularyForm({ ...vocabularyForm, difficulty: event.target.value })}
                placeholder="difficulty"
              />
              <input
                className={fieldClass}
                type="number"
                value={vocabularyForm.courseId}
                onChange={(event) => setVocabularyForm({ ...vocabularyForm, courseId: event.target.value })}
                placeholder="courseId"
              />
              <textarea
                className={`${textareaClass} md:col-span-2`}
                value={vocabularyForm.exampleSentence}
                onChange={(event) => setVocabularyForm({ ...vocabularyForm, exampleSentence: event.target.value })}
                placeholder="exampleSentence"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={primaryButtonClass} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Saqlash
              </button>
              {selectedVocabularyId ? (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setSelectedVocabularyId(null);
                    setVocabularyForm(emptyVocabularyForm);
                  }}
                >
                  Bekor qilish
                </button>
              ) : null}
            </div>
          </form>

          <div className="app-card p-5">
            <SectionTitle title="Vocabulary ro'yxati" description="So'zlarni qidiring, tahrirlang yoki o'chiring." icon={ClipboardList} />
            <div className="relative mb-4">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
              />
              <input
                className={`${fieldClass} pl-10`}
                value={vocabularySearch}
                onChange={(event) => setVocabularySearch(event.target.value)}
                placeholder="Vocabulary ichidan qidirish"
              />
            </div>
            <div className="space-y-3">
              {filteredVocabularies.map((item, index) => (
                <article
                  key={`${item?.id ?? index}`}
                  className="rounded-lg border border-[var(--app-border)] bg-white p-4 transition-all hover:border-[var(--app-primary)]/35"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone="primary">ID {item?.id ?? '-'}</Badge>
                        <Badge tone="warning">Level {item?.difficulty ?? 1}</Badge>
                      </div>
                      <p className="truncate text-base font-black text-[var(--app-text)]">{item?.word ?? '-'}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--app-muted)]">{item?.translation ?? '-'}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {item?.id ? (
                        <button
                          className={iconButtonClass}
                          onClick={() => void editVocabulary(Number(item.id))}
                          title="Tahrirlash"
                          aria-label="Vocabulary tahrirlash"
                        >
                          <Edit3 size={16} />
                        </button>
                      ) : null}
                      {item?.id ? (
                        <button
                          className={iconButtonClass}
                          onClick={() => void removeVocabulary(Number(item.id))}
                          title="O'chirish"
                          aria-label="Vocabulary o'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {!filteredVocabularies.length ? (
                <EmptyBlock title="Vocabulary topilmadi" description="Qidiruvni tozalang yoki yangi so'z qo'shing." />
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <form onSubmit={handleSaveWordList} className="app-card p-5">
            <SectionTitle
              title={selectedWordListId ? 'Word list tahrirlash' : 'Word list yaratish'}
              description="Studentga tegishli yoki public listlarni boshqaring."
              icon={Layers3}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={fieldClass}
                value={wordListForm.title}
                onChange={(event) => setWordListForm({ ...wordListForm, title: event.target.value })}
                placeholder="title"
              />
              <input
                className={fieldClass}
                value={wordListForm.name}
                onChange={(event) => setWordListForm({ ...wordListForm, name: event.target.value })}
                placeholder="name"
              />
              <input
                className={fieldClass}
                type="number"
                value={wordListForm.studentId}
                onChange={(event) => setWordListForm({ ...wordListForm, studentId: event.target.value })}
                placeholder="studentId"
              />
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--app-text)]">
                <input
                  type="checkbox"
                  checked={wordListForm.isPublic}
                  onChange={(event) => setWordListForm({ ...wordListForm, isPublic: event.target.checked })}
                  className="h-4 w-4 accent-[var(--app-primary)]"
                />
                Public list
              </label>
              <textarea
                className={`${textareaClass} md:col-span-2`}
                value={wordListForm.description}
                onChange={(event) => setWordListForm({ ...wordListForm, description: event.target.value })}
                placeholder="description"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={primaryButtonClass} disabled={saving}>
                Saqlash
              </button>
              {selectedWordListId ? (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setSelectedWordListId(null);
                    setWordListItems([]);
                    setWordListForm(emptyWordListForm);
                  }}
                >
                  Bekor qilish
                </button>
              ) : null}
            </div>
          </form>

          <div className="app-card p-5">
            <SectionTitle title="Word lists" description="Listni tanlasangiz itemlari pastda ochiladi." icon={ClipboardList} />
            <div className="relative mb-4">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
              />
              <input
                className={`${fieldClass} pl-10`}
                value={wordListSearch}
                onChange={(event) => setWordListSearch(event.target.value)}
                placeholder="Word list ichidan qidirish"
              />
            </div>
            <div className="space-y-3">
              {filteredWordLists.map((item, index) => {
                const selected = selectedWordListId === Number(item?.id);

                return (
                  <article
                    key={`${item?.id ?? index}`}
                    className={`rounded-lg border p-4 transition-all ${
                      selected
                        ? 'border-[var(--app-primary)] bg-[color:color-mix(in_srgb,var(--app-primary)_7%,white)]'
                        : 'border-[var(--app-border)] bg-white hover:border-[var(--app-primary)]/35'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone={item?.isPublic ? 'success' : 'muted'}>
                            {item?.isPublic ? 'Public' : 'Private'}
                          </Badge>
                          <Badge tone="primary">ID {item?.id ?? '-'}</Badge>
                        </div>
                        <p className="truncate text-base font-black text-[var(--app-text)]">{getItemTitle(item)}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-[var(--app-muted)]">
                          Student: {item?.studentId ?? '-'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {item?.id ? (
                          <button
                            className={iconButtonClass}
                            onClick={() => void selectWordList(Number(item.id))}
                            title="Listni ochish"
                            aria-label="Word listni ochish"
                          >
                            <Search size={16} />
                          </button>
                        ) : null}
                        {item?.id ? (
                          <button
                            className={iconButtonClass}
                            onClick={() => void removeWordList(Number(item.id))}
                            title="O'chirish"
                            aria-label="Word list o'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
              {!filteredWordLists.length ? (
                <EmptyBlock title="Word list topilmadi" description="Yangi list yarating yoki qidiruvni o'zgartiring." />
              ) : null}
            </div>
          </div>

          <div className="app-card p-5">
            <SectionTitle
              title="Word list itemlari"
              description={selectedWordListId ? `Tanlangan list ID: ${selectedWordListId}` : 'Avval word list tanlang.'}
              icon={BookOpen}
            />
            <form onSubmit={handleAddItem} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className={fieldClass}
                type="number"
                value={itemVocabularyId}
                onChange={(event) => setItemVocabularyId(event.target.value)}
                placeholder="vocabularyId"
                disabled={!selectedWordListId}
                required
              />
              <button className={primaryButtonClass} disabled={!selectedWordListId || saving}>
                <Plus size={14} />
                Qo'shish
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {wordListItems.map((item, index) => (
                <div
                  key={`${item?.id ?? item?.vocabularyId ?? index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--app-border)] bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-[var(--app-text)]">{getItemTitle(item)}</p>
                    <p className="text-xs font-semibold text-[var(--app-muted)]">
                      Vocabulary ID: {item?.vocabularyId ?? item?.vocabulary?.id ?? item?.id ?? '-'}
                    </p>
                  </div>
                  <button
                    className={iconButtonClass}
                    onClick={() => void removeItem(item)}
                    title="Listdan olib tashlash"
                    aria-label="Word list itemni olib tashlash"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {!wordListItems.length ? (
                <EmptyBlock
                  title="Itemlar yo'q"
                  description="Word list tanlang yoki vocabulary ID orqali yangi item qo'shing."
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <form onSubmit={loadStudentProgress} className="app-card p-5">
          <SectionTitle title="Student vocabulary progress" icon={TrendingUp} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className={fieldClass}
              type="number"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="studentId"
              required
            />
            <button className={secondaryButtonClass} disabled={saving}>
              Yuklash
            </button>
          </div>
          {studentProgress.length ? <JsonBlock className="mt-4" data={studentProgress} /> : null}
        </form>

        <form onSubmit={loadProgressDetail} className="app-card p-5">
          <SectionTitle title="Progress detail" icon={ClipboardList} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className={fieldClass}
              type="number"
              value={progressId}
              onChange={(event) => setProgressId(event.target.value)}
              placeholder="progressId"
              required
            />
            <button className={secondaryButtonClass} disabled={saving}>
              Yuklash
            </button>
          </div>
          <JsonBlock className="mt-4" data={{ dueReviews, progressDetail }} />
        </form>
      </div>
    </PageShell>
  );
}
