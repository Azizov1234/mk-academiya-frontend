"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { localeCookieName } from "@/i18n/config";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  LogIn,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link_next from "next/link";
import { createLead, getPublicCenterSettings } from "@/lib/backend-api";
import {
  DEFAULT_ABOUT_POINTS,
  DEFAULT_CENTER_BRANDING,
  DEFAULT_COURSE_TRACKS,
  DEFAULT_TEAM_MEMBERS,
  normalizeCenterBranding,
  type CenterBranding,
} from "@/lib/branding";
import { useCenterBranding } from "./branding/CenterBrandingProvider";
import "./landing.css";

/* ─── nav links ─────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Biz haqimizda", href: "#about" },
  { label: "Imkoniyatlar", href: "#features" },
  { label: "Kurslar", href: "#courses" },
  { label: "Jamoa", href: "#team" },
  { label: "Savollar", href: "#faq" },
  { label: "Bog'lanish", href: "#contact" },
];

const FEATURES = [
  {
    icon: BookOpen,
    color: "from-blue-500 to-blue-700",
    title: "CEFR yo'nalishi",
    desc: "A1 dan C2 gacha bosqichma-bosqich o'quv rejasi. Har bir darajada aniq maqsad va o'lchov.",
  },
  {
    icon: Trophy,
    color: "from-indigo-500 to-purple-600",
    title: "Gamification",
    desc: "XP, reyting va natijalar orqali doimiy motivatsiya. O'rganish jarayoni qiziqarli bo'ladi.",
  },
  {
    icon: Users,
    color: "from-cyan-500 to-blue-600",
    title: "Mentor nazorati",
    desc: "Guruhlar, topshiriqlar va fikr-mulohaza bitta platformada. Har qadamda qo'llab-quvvatlash.",
  },
  {
    icon: Zap,
    color: "from-emerald-500 to-teal-600",
    title: "Tez natija",
    desc: "Intensiv darslar va spaced repetition texnikasi bilan 3 oyda sezilarli o'sish.",
  },
  {
    icon: Star,
    color: "from-amber-400 to-orange-500",
    title: "IELTS tayyorlov",
    desc: "Maqsadli trening, mock test va expert feedback bilan 7.0+ ball.",
  },
  {
    icon: MessageCircle,
    color: "from-rose-500 to-pink-600",
    title: "Speaking club",
    desc: "Native speaker va tengdoshlar bilan haftasiga 3 marta amaliyot sessiyalari.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Qaysi darajadan boshlashim kerak?",
    a: "Avval qisqa placement test topshirasiz. Natijaga qarab sizga mos kurs va guruh tavsiya qilinadi. Placement test 15 daqiqa oladi va bepul.",
  },
  {
    q: "IELTS kursi qancha davom etadi?",
    a: "Odatda 3-6 oy. Aniq muddat boshlang'ich daraja va target ballga bog'liq. Intensiv kurs 3 oy, standart kurs 6 oy davom etadi.",
  },
  {
    q: "Online o'qish mumkinmi?",
    a: "Ha, offline, online va hybrid formatdagi guruhlar mavjud. Online darslar Zoom orqali, yozuvlari platformada saqlanadi.",
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: "Oylik to'lov yoki to'liq kurs uchun chegirmali to'lov. Naqd, karta va bank o'tkazma orqali qabul qilinadi.",
  },
];

const COURSE_COLORS = [
  { from: "#3b82f6", to: "#1d4ed8" },
  { from: "#8b5cf6", to: "#6d28d9" },
  { from: "#10b981", to: "#059669" },
  { from: "#f59e0b", to: "#d97706" },
  { from: "#06b6d4", to: "#0284c7" },
  { from: "#ec4899", to: "#db2777" },
];

/* ─── Settings hook ─────────────────────────────────────────────── */
function usePublicLandingSettings() {
  const { centerBranding } = useCenterBranding();
  const [settings, setSettings] = useState<CenterBranding>(
    normalizeCenterBranding(centerBranding)
  );
  useEffect(() => {
    let active = true;
    getPublicCenterSettings()
      .then((data) => {
        if (active) setSettings(normalizeCenterBranding(data));
      })
      .catch(() => {
        if (active) setSettings(normalizeCenterBranding(centerBranding));
      });
    return () => {
      active = false;
    };
  }, [centerBranding]);
  return settings;
}

/* ─── Language switcher ─────────────────────────────────────────── */
const LANG_OPTIONS = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
] as const;

function LangSwitcher() {
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${localeCookieName}=`));
    const saved = cookie?.split('=')[1];
    if (saved === 'ru' || saved === 'uz' || saved === 'en') {
      setCurrent(saved);
    }
  }, []);

  const switchLang = (code: string) => {
    document.cookie = `${localeCookieName}=${code}; path=/; max-age=31536000; samesite=lax`;
    setCurrent(code);
    window.location.reload();
  };

  return (
    <div className="lp-lang" aria-label="Til tanlash">
      {LANG_OPTIONS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => switchLang(lang.code)}
          className={`lp-lang__item ${
            current === lang.code ? "lp-lang__item--active" : ""
          }`}
          aria-label={`Switch to ${lang.label}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Scroll reveal hook ────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("lp-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Section wrapper ───────────────────────────────────────────── */
function Reveal({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`lp-reveal ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export function LandingPage() {
  const settings = usePublicLandingSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", message: "" });

  const aboutPoints = settings.aboutPoints?.length
    ? settings.aboutPoints
    : DEFAULT_ABOUT_POINTS;
  const courses = settings.courseTracks?.length
    ? settings.courseTracks
    : DEFAULT_COURSE_TRACKS;
  const team = settings.teamMembers?.length
    ? settings.teamMembers
    : DEFAULT_TEAM_MEMBERS;

  const stats = useMemo(
    () => [
      { value: "500+", label: "O'quvchilar" },
      { value: `${Math.max(courses.length, 3)}+`, label: "Kurslar" },
      { value: "94%", label: "Muvaffaqiyat" },
      { value: "7.5", label: "IELTS o'rtacha" },
      { value: "48+", label: "Guruhlar" },
      { value: `${Math.max(team.length, 3)}+`, label: "Mentorlar" },
    ],
    [courses.length, team.length]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("Barcha maydonlarni to'ldiring.");
      return;
    }
    setLoading(true);
    try {
      await createLead({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      toast.success("Yuborildi! Admin tez orada bog'lanadi.");
      setForm({ fullName: "", phone: "", message: "" });
    } catch {
      toast.error("Xabar yuborilmadi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lp-root">
      {/* ══════════════════════ NAVBAR ══════════════════════════════ */}
      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <div className="lp-container lp-nav__inner">
          <a href="#hero" className="lp-nav__logo">
            <img
              src={settings.logoUrl || DEFAULT_CENTER_BRANDING.logoUrl}
              alt={settings.shortName}
              className="lp-nav__logo-img"
            />
            <span className="lp-nav__logo-text">{settings.shortName}</span>
          </a>

          <div className="lp-nav__links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="lp-nav__link">
                {l.label}
              </a>
            ))}
          </div>

          <div className="lp-nav__actions">
            <LangSwitcher />
            <Link href="/login" className="lp-btn lp-btn--ghost lp-btn--sm">
              <LogIn size={15} /> Kirish
            </Link>
            <a href="#contact" className="lp-btn lp-btn--primary lp-btn--sm">
              Ro'yxatdan o'tish <ArrowRight size={15} />
            </a>
          </div>

          <button
            type="button"
            className="lp-nav__burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menyu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lp-nav__mobile">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="lp-nav__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="lp-nav__mobile-actions">
              <div style={{ paddingBottom: '8px' }}>
                <LangSwitcher />
              </div>
              <Link
                href="/login"
                className="lp-btn lp-btn--outline lp-btn--full"
                onClick={() => setMenuOpen(false)}
              >
                <LogIn size={16} /> Kirish
              </Link>
              <a
                href="#contact"
                className="lp-btn lp-btn--primary lp-btn--full"
                onClick={() => setMenuOpen(false)}
              >
                Ro'yxatdan o'tish
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════ HERO ════════════════════════════════ */}
      <section id="hero" className="lp-hero">
        <div className="lp-container lp-hero__content">
          <div className="lp-hero__badge">
            <Sparkles size={14} className="lp-hero__badge-icon" />
            Ingliz tilini biz bilan o'rganing
          </div>

          <h1 className="lp-hero__title">
            {settings.name}
            <br />
            <span className="lp-hero__title-sub">
              English mastery shu yerdan boshlanadi
            </span>
          </h1>

          <p className="lp-hero__desc">{settings.description}</p>

          <div className="lp-hero__ctas">
            <a href="#contact" className="lp-btn lp-btn--primary lp-btn--lg">
              Boshlash <ArrowRight size={18} />
            </a>
            <a href="#courses" className="lp-btn lp-btn--white lp-btn--lg">
              Kurslarni ko'rish <ChevronDown size={18} />
            </a>
            <Link
              href="/public-exam"
              className="lp-btn lp-btn--ghost-white lp-btn--lg"
            >
              Ochiq imtihon
            </Link>
          </div>

          <div className="lp-hero__visual" aria-label="MK Academy platformasi">
            <div className="lp-hero__visual-panel">
              <div className="lp-hero__visual-top">
                <img
                  src={settings.logoUrl || DEFAULT_CENTER_BRANDING.logoUrl}
                  alt={settings.shortName}
                  className="lp-hero__visual-logo"
                />
                <div>
                  <p className="lp-hero__visual-kicker">Bugungi reja</p>
                  <p className="lp-hero__visual-title">{settings.shortName}</p>
                </div>
              </div>
              <div className="lp-hero__progress">
                <span />
              </div>
              <div className="lp-hero__visual-grid">
                <div>
                  <strong>CEFR</strong>
                  <span>A1 - C2</span>
                </div>
                <div>
                  <strong>IELTS</strong>
                  <span>Mock test</span>
                </div>
                <div>
                  <strong>XP</strong>
                  <span>Reyting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="lp-hero__stats">
            {stats.map((s) => (
              <div key={s.label} className="lp-hero__stat">
                <span className="lp-hero__stat-value">{s.value}</span>
                <span className="lp-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#about" className="lp-hero__scroll">
          <ChevronDown size={20} className="lp-hero__scroll-icon" />
        </a>
      </section>

      {/* ══════════════════════ ABOUT ═══════════════════════════════ */}
      <section id="about" className="lp-section">
        <div className="lp-container lp-about">
          <Reveal className="lp-about__text">
            <p className="lp-label">Biz haqimizda</p>
            <h2 className="lp-heading">
              Har bir o'quvchi uchun
              <br />
              aniq o'sish yo'li
            </h2>
            <p className="lp-body">{settings.aboutText}</p>
            <a
              href="#contact"
              className="lp-btn lp-btn--primary lp-btn--md lp-mt-6"
            >
              Bepul konsultatsiya <ArrowRight size={16} />
            </a>
          </Reveal>

          <Reveal className="lp-about__points">
            {aboutPoints.map((pt, i) => (
              <div key={i} className="lp-about__point">
                <div className="lp-about__point-icon">
                  <CheckCircle2 size={20} />
                </div>
                <span className="lp-about__point-text">{pt}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ════════════════════════════ */}
      <section id="features" className="lp-section lp-section--alt">
        <div className="lp-container">
          <Reveal className="lp-section__head">
            <p className="lp-label">Imkoniyatlar</p>
            <h2 className="lp-heading">Ta'lim jarayoni bitta tizimda</h2>
            <p className="lp-body lp-body--center">
              Zamonaviy texnologiya va metodika birlashib, eng samarali natijani
              beradi.
            </p>
          </Reveal>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                className="lp-feature-card"
                style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}
              >
                <div
                  className="lp-feature-card__icon"
                  style={{
                    background: `linear-gradient(135deg, ${
                      COURSE_COLORS[i % COURSE_COLORS.length].from
                    }, ${COURSE_COLORS[i % COURSE_COLORS.length].to})`,
                  }}
                >
                  <f.icon size={22} color="#fff" />
                </div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ COURSES ═════════════════════════════ */}
      <section id="courses" className="lp-section">
        <div className="lp-container">
          <Reveal className="lp-section__head">
            <p className="lp-label">Yo'nalishlar</p>
            <h2 className="lp-heading">Sizga mos kurs</h2>
            <p className="lp-body lp-body--center">
              CEFR standartiga asoslangan, bosqichma-bosqich o'quv dasturlari.
            </p>
          </Reveal>

          <div className="lp-courses-grid">
            {courses.map((c, i) => {
              const col = COURSE_COLORS[i % COURSE_COLORS.length];
              return (
                <Reveal
                  key={`${c.title}-${i}`}
                  className="lp-course-card"
                  style={
                    { animationDelay: `${i * 80}ms` } as React.CSSProperties
                  }
                >
                  <div
                    className="lp-course-card__stripe"
                    style={{
                      background: `linear-gradient(90deg, ${col.from}, ${col.to})`,
                    }}
                  />
                  <div className="lp-course-card__body">
                    <span
                      className="lp-course-card__level"
                      style={{
                        color: col.from,
                        backgroundColor: `${col.from}18`,
                      }}
                    >
                      {c.level}
                    </span>
                    <h3 className="lp-course-card__title">{c.title}</h3>
                    <p className="lp-course-card__desc">{c.desc}</p>
                    <a
                      href="#contact"
                      className="lp-course-card__cta"
                      style={{ color: col.from }}
                    >
                      Kursga yozilish <ArrowRight size={14} />
                    </a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ TEAM ════════════════════════════════ */}
      <section id="team" className="lp-section lp-section--alt">
        <div className="lp-container">
          <Reveal className="lp-section__head">
            <p className="lp-label">Jamoa</p>
            <h2 className="lp-heading">Siz bilan ishlaydigan mentorlar</h2>
            <p className="lp-body lp-body--center">
              Har bir mentor o'z yo'nalishida sertifikatlangan va tajribali
              mutaxassis.
            </p>
          </Reveal>

          <div className="lp-team-grid">
            {team.map((m) => (
              <Reveal key={m.name} className="lp-team-card">
                <div className="lp-team-card__img-wrap">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="lp-team-card__img"
                  />
                </div>
                <div className="lp-team-card__body">
                  <h3 className="lp-team-card__name">{m.name}</h3>
                  <p className="lp-team-card__role">{m.role}</p>
                  <p className="lp-team-card__focus">{m.focus}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FAQ ═════════════════════════════════ */}
      <section id="faq" className="lp-section">
        <div className="lp-container lp-faq">
          <Reveal className="lp-section__head">
            <p className="lp-label">Savollar</p>
            <h2 className="lp-heading">Ko'p so'raladigan savollar</h2>
          </Reveal>

          <div className="lp-faq__list">
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={i} className="lp-faq__item">
                <button
                  type="button"
                  className="lp-faq__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {openFaq === i && <div className="lp-faq__a">{item.a}</div>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CONTACT ═════════════════════════════ */}
      <section id="contact" className="lp-section lp-section--blue">
        <div className="lp-container lp-contact">
          <Reveal className="lp-contact__info">
            <p className="lp-label lp-label--white">Bog'lanish</p>
            <h2 className="lp-heading lp-heading--white">
              Bugun birinchi qadamni qo'ying
            </h2>
            <p className="lp-body lp-body--white-muted">
              Savol, konsultatsiya yoki ro'yxatdan o'tish uchun yozing — admin
              24 soat ichida javob beradi.
            </p>

            <div className="lp-contact__details">
              {[
                { icon: MapPin, label: "Manzil", value: settings.address },
                { icon: Phone, label: "Aloqa", value: settings.phoneNumber },
                {
                  icon: Clock,
                  label: "Ish vaqti",
                  value: settings.workingHours,
                },
              ].map(
                (item) =>
                  item.value && (
                    <div key={item.label} className="lp-contact__detail">
                      <div className="lp-contact__detail-icon">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <div className="lp-contact__detail-label">
                          {item.label}
                        </div>
                        <div className="lp-contact__detail-value">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </Reveal>

          <Reveal className="lp-contact__form-wrap">
            <form onSubmit={handleSubmit} className="lp-contact__form">
              <h3 className="lp-contact__form-title">
                <MessageCircle size={20} />
                Savolingizni yuboring
              </h3>
              <input
                className="lp-input"
                placeholder="To'liq ism"
                value={form.fullName}
                onChange={(e) =>
                  setForm((v) => ({ ...v, fullName: e.target.value }))
                }
                required
              />
              <input
                className="lp-input"
                placeholder="Telefon: +998 90 000 00 00"
                value={form.phone}
                onChange={(e) =>
                  setForm((v) => ({ ...v, phone: e.target.value }))
                }
                required
              />
              <textarea
                className="lp-input lp-input--textarea"
                placeholder="Savol yoki xabar..."
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((v) => ({ ...v, message: e.target.value }))
                }
                required
              />
              <button
                type="submit"
                className="lp-btn lp-btn--primary lp-btn--full lp-btn--lg"
                disabled={loading}
              >
                <Send size={16} />
                {loading ? "Yuborilmoqda..." : "Yuborish"}
              </button>
              <p className="lp-contact__form-note">
                ✓ Spam yo'q. Faqat kurs haqida ma'lumot.
              </p>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <div className="lp-footer__logo">
              <img
                src={settings.logoUrl || DEFAULT_CENTER_BRANDING.logoUrl}
                alt={settings.shortName}
                className="lp-footer__logo-img"
              />
              <span className="lp-footer__logo-text">{settings.shortName}</span>
            </div>
            <p className="lp-footer__tagline">{settings.description}</p>
          </div>

          <div className="lp-footer__links">
            <p className="lp-footer__links-title">Saytda</p>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="lp-footer__link">
                {l.label}
              </a>
            ))}
          </div>

          <div className="lp-footer__links">
            <p className="lp-footer__links-title">Platforma</p>
            <Link href="/login" className="lp-footer__link">
              Tizimga kirish
            </Link>
            <Link href="/public-exam" className="lp-footer__link">
              Ochiq imtihon
            </Link>
            <Link href="/public-rating" className="lp-footer__link">
              Reyting
            </Link>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <div className="lp-container">
            <span>© 2026 {settings.name}. Barcha huquqlar himoyalangan.</span>
            <div className="lp-footer__bottom-right">
              <GraduationCap size={15} />
              <span>Powered by MK Academy Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
