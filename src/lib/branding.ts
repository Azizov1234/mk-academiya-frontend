export type TeamMember = {
  name: string;
  role: string;
  image: string;
  focus: string;
};

export type CourseTrack = {
  title: string;
  level: string;
  desc: string;
};

export type SocialLinks = {
  telegram?: string;
  instagram?: string;
  youtube?: string;
};

export type CenterBranding = {
  id?: number;
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;

  // Landing page content
  aboutText?: string;
  aboutPoints?: string[];
  teamMembers?: TeamMember[];
  courseTracks?: CourseTrack[];
  address?: string;
  phoneNumber?: string;
  workingHours?: string;
  socialLinks?: SocialLinks;
  mapEmbedUrl?: string;
};

export const DEFAULT_ABOUT_POINTS: string[] = [
  "CEFR darajalariga moslashgan darslar (A1 - C2)",
  "IELTS va General English tayyorgarlik",
  "So'z boyligini SM-2 algoritmi bilan mustahkamlash",
  "Guruh ichida do'stlar bilan raqobatlashish",
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Maqsud Aliyev",
    role: "IELTS Mentor",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    focus: "Reading va Writing strategiyalari",
  },
  {
    name: "Nigina Tursunova",
    role: "Speaking Coach",
    image:
      "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&q=80",
    focus: "Fluency, pronunciation va confidence",
  },
  {
    name: "Dilshod Karimov",
    role: "Academic Coordinator",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    focus: "Guruhlar, natijalar va o'quv reja",
  },
];

export const DEFAULT_COURSE_TRACKS: CourseTrack[] = [
  {
    title: "General English",
    level: "A1 - B2",
    desc: "Noldan boshlab mustahkam grammatika, so'z boyligi va speaking asoslari.",
  },
  {
    title: "IELTS Preparation",
    level: "B1 - C1",
    desc: "IELTS reading, listening, writing va speaking bo'yicha intensiv tayyorgarlik.",
  },
  {
    title: "Speaking Club Pro",
    level: "B1+",
    desc: "Real suhbat, debate, presentation va IELTS speaking formatlari.",
  },
];

export const DEFAULT_CENTER_BRANDING: CenterBranding = {
  name: "MK Academy",
  shortName: "MK Academy",
  logoUrl:
    "https://res.cloudinary.com/dpfbu9aid/image/upload/v1777795606/photo_2026-04-30_11-37-47_hvkj9q.jpg",
  description:
    "Ingliz tilini CEFR standarti bo'yicha noldan professional darajagacha o'rganish platformasi.",
  aboutText:
    "MK Academy - ingliz tilini noldan C2 darajagacha o'rgatishga ixtisoslashgan ta'lim platformasi. Biz CEFR standartiga asoslangan darsliklar va interaktiv testlar orqali har bir o'quvchiga individual yondashamiz.",
  aboutPoints: DEFAULT_ABOUT_POINTS,
  teamMembers: DEFAULT_TEAM_MEMBERS,
  courseTracks: DEFAULT_COURSE_TRACKS,
  address: "Toshkent shahri, O'zbekiston",
  phoneNumber: "+998 90 000 00 00",
  workingHours: "Dushanba - Shanba, 09:00 - 20:00",
  socialLinks: { telegram: "", instagram: "", youtube: "" },
  mapEmbedUrl: "",
};

function tryParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw?.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function normalizeCenterBranding(
  input?: Partial<Record<string, unknown>> | null
): CenterBranding {
  const raw = input as Record<string, unknown> | null | undefined;

  return {
    id: raw?.id as number | undefined,
    name:
      (raw?.name as string | undefined)?.trim() || DEFAULT_CENTER_BRANDING.name,
    shortName:
      (raw?.shortName as string | undefined)?.trim() ||
      (raw?.name as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.shortName,
    logoUrl:
      (raw?.logoUrl as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.logoUrl,
    description:
      (raw?.description as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.description,
    createdAt: raw?.createdAt as string | undefined,
    updatedAt: raw?.updatedAt as string | undefined,

    // Landing content — may arrive as JSON strings or already-parsed arrays
    aboutText:
      (raw?.aboutText as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.aboutText,

    aboutPoints: Array.isArray(raw?.aboutPoints)
      ? (raw.aboutPoints as string[])
      : tryParseJson<string[]>(
          raw?.aboutPoints as string | undefined,
          DEFAULT_ABOUT_POINTS
        ),

    teamMembers: Array.isArray(raw?.teamMembers)
      ? (raw.teamMembers as TeamMember[])
      : tryParseJson<TeamMember[]>(
          raw?.teamMembers as string | undefined,
          DEFAULT_TEAM_MEMBERS
        ),

    courseTracks: Array.isArray(raw?.courseTracks)
      ? (raw.courseTracks as CourseTrack[])
      : tryParseJson<CourseTrack[]>(
          raw?.courseTracks as string | undefined,
          DEFAULT_COURSE_TRACKS
        ),

    address:
      (raw?.address as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.address,

    phoneNumber:
      (raw?.phoneNumber as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.phoneNumber,

    workingHours:
      (raw?.workingHours as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.workingHours,

    socialLinks:
      typeof raw?.socialLinks === "object" && raw.socialLinks !== null
        ? (raw.socialLinks as SocialLinks)
        : tryParseJson<SocialLinks>(
            raw?.socialLinks as string | undefined,
            DEFAULT_CENTER_BRANDING.socialLinks!
          ),

    mapEmbedUrl:
      (raw?.mapEmbedUrl as string | undefined)?.trim() ||
      DEFAULT_CENTER_BRANDING.mapEmbedUrl,
  };
}
