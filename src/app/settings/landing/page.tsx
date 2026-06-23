"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getCenterSettings, updateCenterSettings } from "@/lib/backend-api";
import {
  Save,
  ChevronLeft,
  Loader2,
  Users,
  BookOpen,
  MapPin,
  Phone,
  Clock,
  Globe,
  Image,
  FileText,
  List,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface TeamMember {
  name: string;
  role: string;
  image: string;
  focus: string;
}

interface CourseTrack {
  title: string;
  level: string;
  desc: string;
}

interface SocialLinks {
  telegram: string;
  instagram: string;
  youtube: string;
}

interface LandingForm {
  // Branding
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  // About
  aboutText: string;
  aboutPoints: string[];
  // Team
  teamMembers: TeamMember[];
  // Courses
  courseTracks: CourseTrack[];
  // Location & contact
  address: string;
  phoneNumber: string;
  workingHours: string;
  // Social
  telegram: string;
  instagram: string;
  youtube: string;
  mapEmbedUrl: string;
}

const EMPTY_FORM: LandingForm = {
  name: "",
  shortName: "",
  logoUrl: "",
  description: "",
  aboutText: "",
  aboutPoints: [""],
  teamMembers: [{ name: "", role: "", image: "", focus: "" }],
  courseTracks: [{ title: "", level: "", desc: "" }],
  address: "",
  phoneNumber: "",
  workingHours: "",
  telegram: "",
  instagram: "",
  youtube: "",
  mapEmbedUrl: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function tryParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== "string") return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rawToForm(raw: Record<string, unknown>): LandingForm {
  const social = tryParse<SocialLinks>(raw.socialLinks as string, {
    telegram: "",
    instagram: "",
    youtube: "",
  });

  return {
    name: (raw.name as string) || "",
    shortName: (raw.shortName as string) || "",
    logoUrl: (raw.logoUrl as string) || "",
    description: (raw.description as string) || "",
    aboutText: (raw.aboutText as string) || "",
    aboutPoints: tryParse<string[]>(raw.aboutPoints as string, [""]),
    teamMembers: tryParse<TeamMember[]>(raw.teamMembers as string, [
      { name: "", role: "", image: "", focus: "" },
    ]),
    courseTracks: tryParse<CourseTrack[]>(raw.courseTracks as string, [
      { title: "", level: "", desc: "" },
    ]),
    address: (raw.address as string) || "",
    phoneNumber: (raw.phoneNumber as string) || "",
    workingHours: (raw.workingHours as string) || "",
    telegram: social.telegram || "",
    instagram: social.instagram || "",
    youtube: social.youtube || "",
    mapEmbedUrl: (raw.mapEmbedUrl as string) || "",
  };
}

function formToPayload(form: LandingForm): Record<string, string> {
  return {
    name: form.name,
    shortName: form.shortName,
    logoUrl: form.logoUrl,
    description: form.description,
    aboutText: form.aboutText,
    aboutPoints: JSON.stringify(form.aboutPoints.filter((p) => p.trim())),
    teamMembers: JSON.stringify(form.teamMembers.filter((m) => m.name.trim())),
    courseTracks: JSON.stringify(
      form.courseTracks.filter((c) => c.title.trim())
    ),
    address: form.address,
    phoneNumber: form.phoneNumber,
    workingHours: form.workingHours,
    socialLinks: JSON.stringify({
      telegram: form.telegram,
      instagram: form.instagram,
      youtube: form.youtube,
    }),
    mapEmbedUrl: form.mapEmbedUrl,
  };
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)]">
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center border border-[var(--app-border)] bg-white text-[var(--app-primary)]">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--app-text)]">
          {title}
        </h2>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[10px] font-bold text-[var(--app-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm font-bold text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/15";

const textareaCls =
  "w-full resize-none border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm font-bold text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/15";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingSettingsPage() {
  const router = useRouter();
  const { role } = useAuth();

  const [form, setForm] = useState<LandingForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Access guard
  const isSuperAdmin = role === "superadmin";

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getCenterSettings();
      if (raw) setForm(rawToForm(raw as Record<string, unknown>));
    } catch {
      // fallback to empty form
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg(null);
    try {
      await updateCenterSettings(formToPayload(form));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      setSaveStatus("error");
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMsg(
        e?.response?.data?.message ||
          e?.message ||
          "Saqlashda xatolik yuz berdi"
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Array helpers ────────────────────────────────────────────────────────
  const setPoint = (i: number, val: string) =>
    setForm((f) => {
      const pts = [...f.aboutPoints];
      pts[i] = val;
      return { ...f, aboutPoints: pts };
    });

  const addPoint = () =>
    setForm((f) => ({ ...f, aboutPoints: [...f.aboutPoints, ""] }));

  const removePoint = (i: number) =>
    setForm((f) => ({
      ...f,
      aboutPoints: f.aboutPoints.filter((_, idx) => idx !== i),
    }));

  const setTeamField = (i: number, key: keyof TeamMember, val: string) =>
    setForm((f) => {
      const members = [...f.teamMembers];
      members[i] = { ...members[i], [key]: val };
      return { ...f, teamMembers: members };
    });

  const addTeamMember = () =>
    setForm((f) => ({
      ...f,
      teamMembers: [
        ...f.teamMembers,
        { name: "", role: "", image: "", focus: "" },
      ],
    }));

  const removeTeamMember = (i: number) =>
    setForm((f) => ({
      ...f,
      teamMembers: f.teamMembers.filter((_, idx) => idx !== i),
    }));

  const setCourseField = (i: number, key: keyof CourseTrack, val: string) =>
    setForm((f) => {
      const tracks = [...f.courseTracks];
      tracks[i] = { ...tracks[i], [key]: val };
      return { ...f, courseTracks: tracks };
    });

  const addCourseTrack = () =>
    setForm((f) => ({
      ...f,
      courseTracks: [...f.courseTracks, { title: "", level: "", desc: "" }],
    }));

  const removeCourseTrack = (i: number) =>
    setForm((f) => ({
      ...f,
      courseTracks: f.courseTracks.filter((_, idx) => idx !== i),
    }));

  // ── Access check ────────────────────────────────────────────────────────
  if (!isSuperAdmin && !loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="border border-[#f0b7ae] bg-[#fff3f0] p-5 text-[#a53b27]">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-base font-black text-[var(--app-text)]">
          Ruxsat yo&apos;q
        </h2>
        <p className="max-w-xs text-sm font-bold text-[var(--app-muted)]">
          Bu sahifa faqat Superadmin uchun
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 border border-[var(--app-primary)] bg-[var(--app-primary)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white active:scale-95"
        >
          Orqaga
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-[var(--app-primary)]" />
        <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[var(--app-text)]">
              Landing sahifani boshqarish
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
              Superadmin · Sayt kontenti
            </p>
          </div>
        </div>

        <button
          onClick={() => void loadSettings()}
          className="flex h-10 w-10 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] transition-all hover:text-[var(--app-primary)] active:scale-90"
          title="Qayta yuklash"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Save feedback ── */}
      {saveStatus === "success" && (
        <div className="mb-5 flex items-center gap-2 border border-[#9cd7be] bg-[#eefaf4] px-4 py-3 text-sm font-bold text-[#1e6c4d]">
          <CheckCircle2 size={16} />
          Muvaffaqiyatli saqlandi!
        </div>
      )}
      {saveStatus === "error" && errorMsg && (
        <div className="mb-5 flex items-center gap-2 border border-[#f0b7ae] bg-[#fff3f0] px-4 py-3 text-sm font-bold text-[#a53b27]">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <div className="space-y-5">
        {/* ══ Asosiy branding ══════════════════════════════════════════════ */}
        <Section icon={Image} title="Asosiy branding">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Markaz nomi">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="MK Academy"
              />
            </Field>
            <Field label="Qisqa nomi">
              <input
                className={inputCls}
                value={form.shortName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shortName: e.target.value }))
                }
                placeholder="MK"
              />
            </Field>
          </div>
          <Field label="Logo URL">
            <input
              className={inputCls}
              value={form.logoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, logoUrl: e.target.value }))
              }
              placeholder="https://..."
              type="url"
            />
          </Field>
          <Field label="Tavsif (hero section)">
            <textarea
              className={textareaCls}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ingliz tilini CEFR standarti bo'yicha..."
            />
          </Field>
        </Section>

        {/* ══ Biz haqimizda ════════════════════════════════════════════════ */}
        <Section icon={FileText} title="Biz haqimizda">
          <Field label="Asosiy matn">
            <textarea
              className={textareaCls}
              rows={4}
              value={form.aboutText}
              onChange={(e) =>
                setForm((f) => ({ ...f, aboutText: e.target.value }))
              }
              placeholder="MK Academy - ingliz tilini noldan C2 darajagacha..."
            />
          </Field>

          <Field
            label="Afzalliklar ro'yxati"
            hint="Har bir qator alohida nuqta sifatida ko'rsatiladi"
          >
            <div className="space-y-2">
              {form.aboutPoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={pt}
                    onChange={(e) => setPoint(i, e.target.value)}
                    placeholder={`${i + 1}-nuqta...`}
                  />
                  <button
                    onClick={() => removePoint(i)}
                    disabled={form.aboutPoints.length <= 1}
                    className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#f0b7ae] bg-[#fff3f0] text-[#a53b27] transition-all hover:bg-[#a53b27] hover:text-white active:scale-90 disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={addPoint}
                className="flex items-center gap-2 border border-dashed border-[var(--app-border)] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)] transition-all hover:border-[var(--app-primary)] hover:text-[var(--app-primary)] active:scale-95"
              >
                <Plus size={14} />
                Nuqta qo'shish
              </button>
            </div>
          </Field>
        </Section>

        {/* ══ Jamoa ════════════════════════════════════════════════════════ */}
        <Section icon={Users} title="Mentorlar va jamoa">
          <div className="space-y-4">
            {form.teamMembers.map((member, i) => (
              <div
                key={i}
                className="relative border border-[var(--app-border)] bg-[var(--app-bg)] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    Mentor #{i + 1}
                  </span>
                  <button
                    onClick={() => removeTeamMember(i)}
                    disabled={form.teamMembers.length <= 1}
                    className="flex h-7 w-7 items-center justify-center border border-[#f0b7ae] bg-[#fff3f0] text-[#a53b27] transition-all hover:bg-[#a53b27] hover:text-white active:scale-90 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Ism">
                    <input
                      className={inputCls}
                      value={member.name}
                      onChange={(e) => setTeamField(i, "name", e.target.value)}
                      placeholder="Ali Valiyev"
                    />
                  </Field>
                  <Field label="Lavozim">
                    <input
                      className={inputCls}
                      value={member.role}
                      onChange={(e) => setTeamField(i, "role", e.target.value)}
                      placeholder="IELTS Mentor"
                    />
                  </Field>
                  <Field label="Rasm URL">
                    <input
                      className={inputCls}
                      value={member.image}
                      onChange={(e) => setTeamField(i, "image", e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                  </Field>
                  <Field label="Yo'nalish / Focus">
                    <input
                      className={inputCls}
                      value={member.focus}
                      onChange={(e) => setTeamField(i, "focus", e.target.value)}
                      placeholder="Reading va Writing strategiyalari"
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              onClick={addTeamMember}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-[var(--app-border)] py-3 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)] transition-all hover:border-[var(--app-primary)] hover:text-[var(--app-primary)] active:scale-95"
            >
              <Plus size={14} />
              Mentor qo&apos;shish
            </button>
          </div>
        </Section>

        {/* ══ Kurslar ══════════════════════════════════════════════════════ */}
        <Section icon={BookOpen} title="Kurs yo'nalishlari">
          <div className="space-y-4">
            {form.courseTracks.map((track, i) => (
              <div
                key={i}
                className="border border-[var(--app-border)] bg-[var(--app-bg)] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                    Kurs #{i + 1}
                  </span>
                  <button
                    onClick={() => removeCourseTrack(i)}
                    disabled={form.courseTracks.length <= 1}
                    className="flex h-7 w-7 items-center justify-center border border-[#f0b7ae] bg-[#fff3f0] text-[#a53b27] transition-all hover:bg-[#a53b27] hover:text-white active:scale-90 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Kurs nomi">
                    <input
                      className={inputCls}
                      value={track.title}
                      onChange={(e) =>
                        setCourseField(i, "title", e.target.value)
                      }
                      placeholder="General English"
                    />
                  </Field>
                  <Field label="Daraja">
                    <input
                      className={inputCls}
                      value={track.level}
                      onChange={(e) =>
                        setCourseField(i, "level", e.target.value)
                      }
                      placeholder="A1 - B2"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Tavsif">
                      <textarea
                        className={textareaCls}
                        rows={2}
                        value={track.desc}
                        onChange={(e) =>
                          setCourseField(i, "desc", e.target.value)
                        }
                        placeholder="Noldan boshlab mustahkam grammatika..."
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addCourseTrack}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-[var(--app-border)] py-3 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)] transition-all hover:border-[var(--app-primary)] hover:text-[var(--app-primary)] active:scale-95"
            >
              <Plus size={14} />
              Kurs yo&apos;nalishi qo&apos;shish
            </button>
          </div>
        </Section>

        {/* ══ Manzil va aloqa ══════════════════════════════════════════════ */}
        <Section icon={MapPin} title="Manzil va aloqa">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Manzil">
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  className={`${inputCls} pl-10`}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Toshkent shahri, O'zbekiston"
                />
              </div>
            </Field>
            <Field label="Telefon raqam">
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  className={`${inputCls} pl-10`}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  placeholder="+998 90 000 00 00"
                  type="tel"
                />
              </div>
            </Field>
            <Field label="Ish vaqti">
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  className={`${inputCls} pl-10`}
                  value={form.workingHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, workingHours: e.target.value }))
                  }
                  placeholder="Dushanba - Shanba, 09:00 - 20:00"
                />
              </div>
            </Field>
            <Field
              label="Google Maps Embed URL"
              hint="iframe src URL (ixtiyoriy)"
            >
              <div className="relative">
                <Globe
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  className={`${inputCls} pl-10`}
                  value={form.mapEmbedUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))
                  }
                  placeholder="https://www.google.com/maps/embed?..."
                  type="url"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* ══ Ijtimoiy tarmoqlar ═══════════════════════════════════════════ */}
        <Section icon={List} title="Ijtimoiy tarmoqlar">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Telegram">
              <input
                className={inputCls}
                value={form.telegram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telegram: e.target.value }))
                }
                placeholder="https://t.me/mkacademy"
                type="url"
              />
            </Field>
            <Field label="Instagram">
              <input
                className={inputCls}
                value={form.instagram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instagram: e.target.value }))
                }
                placeholder="https://instagram.com/mkacademy"
                type="url"
              />
            </Field>
            <Field label="YouTube">
              <input
                className={inputCls}
                value={form.youtube}
                onChange={(e) =>
                  setForm((f) => ({ ...f, youtube: e.target.value }))
                }
                placeholder="https://youtube.com/@mkacademy"
                type="url"
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* ── Fixed save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--app-border)] bg-[var(--app-bg)]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)]">
            {saveStatus === "success"
              ? "✓ Saqlandi"
              : saveStatus === "error"
              ? "✗ Xatolik"
              : "O\u2019zgarishlarni saqlang"}
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 border border-[var(--app-primary)] bg-[var(--app-primary)] px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
