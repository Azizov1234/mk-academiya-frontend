"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  Home,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { login as loginRequest } from "@/lib/backend-api";
import {
  getUserFriendlyErrorMessage,
  normalizeApiError,
} from "@/lib/offline/errors";
import { localizePath } from "@/i18n/localizedPath";
import {
  clearStoredAuth,
  getStoredRole,
  getStoredToken,
  setStoredAuth,
  setStoredRole,
} from "@/lib/auth-storage";
import { isNativeApp } from "@/lib/native-app";
import { useCenterBranding } from "@/app/components/branding/CenterBrandingProvider";
import { getRoleHomePath } from "@/lib/role-access";
import type { AppLocale } from "@/i18n/config";

type JwtPayload = {
  role?: string;
  exp?: number;
};

type LoginCopy = {
  checkingSession: string;
  backHome: string;
  welcome: string;
  subtitle: string;
  phoneLabel: string;
  passwordLabel: string;
  login: string;
  accessNote: string;
  genericError: string;
  invalidCredentials: string;
  serverError: string;
};

const LOGIN_COPY: Record<AppLocale, LoginCopy> = {
  uz: {
    checkingSession: "Sessiya tekshirilmoqda",
    backHome: "Bosh sahifaga qaytish",
    welcome: "Xush kelibsiz",
    subtitle: "platformasiga kirish uchun ma'lumotlaringizni kiriting.",
    phoneLabel: "Telefon raqam",
    passwordLabel: "Parol",
    login: "Kirish",
    accessNote: "Tizimga faqat ruxsat etilgan o'quvchilar kira oladi.",
    genericError: "Tizimga kirishda xatolik yuz berdi",
    invalidCredentials: "Telefon raqami yoki parol noto'g'ri",
    serverError: "Server bilan bog'lanib bo'lmadi. Qayta urinib ko'ring",
  },
  en: {
    checkingSession: "Checking session",
    backHome: "Back to home",
    welcome: "Welcome back",
    subtitle: "Enter your details to sign in to the platform.",
    phoneLabel: "Phone number",
    passwordLabel: "Password",
    login: "Log in",
    accessNote: "Only authorized learners can sign in to this platform.",
    genericError: "Something went wrong while signing in",
    invalidCredentials: "Phone number or password is incorrect",
    serverError: "We could not reach the server. Please try again.",
  },
  ru: {
    checkingSession: "Proveryaem sessiyu",
    backHome: "Nazad na glavnuyu",
    welcome: "Dobro pozhalovat",
    subtitle: "Voydite v platformu, ukazav svoi dannye.",
    phoneLabel: "Telefon",
    passwordLabel: "Parol",
    login: "Voyti",
    accessNote: "V platformu mogut voyti tolko avtorizovannye ucheniki.",
    genericError: "Ne udalos voiti v sistemu",
    invalidCredentials: "Nevernyy telefon ili parol",
    serverError: "Ne udalos svyazatsya s serverom. Popytaytes eshche raz.",
  },
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function decodeJwtRole(token: string): string | null {
  return decodeJwtPayload(token)?.role?.toLowerCase() || null;
}

function isTokenStillValid(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return false;
  }

  if (!payload.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now();
}

function extractLoginData(body: any): {
  token: string | null;
  role: string | null;
} {
  const token =
    body?.data?.access_token ||
    body?.data?.token ||
    body?.access_token ||
    body?.token ||
    null;

  const roleFromBody =
    body?.data?.user?.role?.toLowerCase?.() ||
    body?.user?.role?.toLowerCase?.() ||
    null;

  const role = roleFromBody || (token ? decodeJwtRole(token) : null);

  return { token, role };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const copy = LOGIN_COPY[locale] ?? LOGIN_COPY.uz;
  const { centerBranding } = useCenterBranding();
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const nativeApp = isNativeApp();

  useEffect(() => {
    const checkSession = async () => {
      const token = await getStoredToken();

      if (!token) {
        setCheckingSession(false);
        return;
      }

      if (!isTokenStillValid(token)) {
        await clearStoredAuth();
        setCheckingSession(false);
        return;
      }

      const storedRole = await getStoredRole();
      const decodedRole = decodeJwtRole(token);

      if (!storedRole && decodedRole) {
        await setStoredRole(decodedRole);
      }

      router.replace(
        localizePath(locale, getRoleHomePath(storedRole || decodedRole))
      );
    };

    void checkSession();
  }, [locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        phone: normalizePhone(formData.phone),
        password: formData.password,
      };
      const body = await loginRequest(payload);
      const { token, role } = extractLoginData(body);

      if (token) {
        await setStoredAuth(token, role);
        router.replace(localizePath(locale, getRoleHomePath(role)));
      } else {
        setError(copy.genericError);
      }
    } catch (err: unknown) {
      const normalizedError = normalizeApiError(err);
      const message = getUserFriendlyErrorMessage(
        normalizedError,
        copy.invalidCredentials
      );

      if (
        normalizedError.code === "BACKEND" &&
        (normalizedError.status === 404 || normalizedError.status === 502)
      ) {
        setError(copy.serverError);
        return;
      }

      if (
        message === "Phone and password do not found" ||
        message === "User is not active"
      ) {
        setError(copy.invalidCredentials);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-[var(--app-bg)] px-safe text-[var(--app-text)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--app-primary)] shadow-xl shadow-[var(--app-primary)]/20">
            <Loader2
              size={30}
              className="animate-spin text-[var(--primary-foreground)]"
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--app-muted)]">
            {copy.checkingSession}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe relative flex flex-col bg-[var(--app-bg)] lg:grid lg:grid-cols-2 overflow-hidden text-[var(--app-text)]">
      {/* Desktop brand panel — left side */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[var(--app-primary)] p-16 text-white">
        <div className="h-20 w-20 overflow-hidden rounded-lg border-2 border-white/20 mb-8">
          <img
            src={centerBranding.logoUrl}
            alt={centerBranding.shortName}
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-center">
          {centerBranding.name}
        </h2>
        <p className="text-lg font-medium text-white/80 text-center max-w-sm leading-relaxed">
          Ingliz tilini CEFR standarti bo'yicha noldan professional darajagacha
          o'rganish platformasi.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-xs">
          {[
            { value: "500+", label: "O'quvchilar" },
            { value: "94%", label: "Muvaffaqiyat" },
            { value: "12+", label: "Kurslar" },
            { value: "7.5", label: "IELTS o'rtacha" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg text-center border border-white/15 bg-white/10 p-4"
            >
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest mt-1 text-white/70">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — login form */}
      <div className="relative flex flex-1 flex-col items-center justify-start px-safe pb-safe pt-safe sm:justify-center sm:p-6 lg:bg-[var(--app-bg)]">
        <motion.button
          initial={nativeApp ? false : { opacity: 0, x: -20 }}
          animate={nativeApp ? undefined : { opacity: 1, x: 0 }}
          onClick={() => router.push(localizePath(locale, "/"))}
          className="app-touch lg:hidden absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[calc(0.75rem+env(safe-area-inset-top))] flex min-h-10 items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-muted)] shadow-sm transition-all hover:text-[var(--app-primary)] sm:left-8 sm:top-8"
        >
          <Home size={14} /> {copy.backHome}
        </motion.button>

        <motion.div
          initial={nativeApp ? false : { opacity: 0, y: 20, scale: 0.96 }}
          animate={nativeApp ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 mt-14 w-full max-w-[28rem] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-premium)] sm:mt-0 sm:p-8 lg:my-0"
        >
          <div className="mb-8 flex flex-col items-center sm:mb-10">
            <motion.div
              whileHover={nativeApp ? undefined : { rotate: 6, scale: 1.04 }}
              className="mb-5 h-16 w-16 overflow-hidden rounded-lg border border-[var(--app-border)] shadow-lg shadow-[var(--app-primary)]/15"
            >
              <img
                src={centerBranding.logoUrl}
                alt={centerBranding.shortName}
                className="h-full w-full object-cover"
              />
            </motion.div>
            <h1 className="mb-2 text-3xl font-black tracking-tighter text-[var(--app-text)] sm:text-4xl">
              {copy.welcome}
            </h1>
            <p className="px-3 text-center text-sm font-bold text-[var(--app-muted)]">
              {centerBranding.shortName} {copy.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {copy.phoneLabel}
              </label>
              <div className="group relative">
                <Phone
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-primary)]"
                  size={20}
                />
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--color-input-background)] py-4 pl-14 pr-6 text-[15px] font-bold text-[var(--app-text)] transition-all placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)]/40 focus:outline-none focus:ring-4 focus:ring-[var(--app-primary)]/10"
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--app-muted)]">
                  {copy.passwordLabel}
                </label>
              </div>
              <div className="group relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-primary)]"
                  size={20}
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--color-input-background)] py-4 pl-14 pr-14 text-[15px] font-bold text-[var(--app-text)] transition-all placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)]/40 focus:outline-none focus:ring-4 focus:ring-[var(--app-primary)]/10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors hover:text-[var(--app-primary)]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-[13px] font-bold text-red-500"
                >
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={nativeApp ? undefined : { scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[var(--app-primary)] py-4 text-base font-black text-[var(--primary-foreground)] shadow-lg shadow-[var(--app-primary)]/15 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  {copy.login} <ArrowRight size={20} strokeWidth={3} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-5 sm:mt-10">
            <p className="text-center text-[12px] font-bold text-[var(--app-muted)]">
              {copy.accessNote}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
