export type MockRole = 'student' | 'teacher' | 'mentor' | 'admin' | 'superadmin';
export type MockUserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPERADMIN';

export interface MockUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: MockUserRole;
  password: string;
  avatarUrl: string | null;
  cefrLevel: string | null;
  language: 'UZ' | 'EN' | 'RU';
  timezone: string;
  dateOfBirth: string | null;
  groupIds: number[];
  createdAt: string;
  isActive: boolean;
}

export interface MockCourseLesson {
  id: number;
  title: string;
  type: 'TASK' | 'TEST';
  dueDate?: string | null;
}

export interface MockCourse {
  id: number;
  title: string;
  level: string;
  isActive: boolean;
  description: string;
  groupIds: number[];
  tasks: MockCourseLesson[];
  tests: MockCourseLesson[];
  _count: {
    tasks: number;
    tests: number;
    groups: number;
  };
}

export interface MockGroup {
  id: number;
  name: string;
  teacherId: number;
  courseIds: number[];
  inviteCode: string;
  nextLesson: string;
  lessons: string;
  _count: {
    members: number;
  };
}

export interface MockBook {
  id: number;
  title: string;
  author: string;
  category: 'GRAMMAR' | 'FICTION' | 'ACADEMIC';
  coverImageUrl: string;
  cefrLevel: string;
  pages: number;
}

export interface MockVocabulary {
  id: number;
  unitId?: number | null;
  courseId?: number | null;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
}

export interface MockLead {
  id: number;
  fullName: string;
  phone: string;
  message?: string;
  answer?: string | null;
  isPublished?: boolean;
  answeredAt?: string | null;
  status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'REJECTED';
  createdAt: string;
}

export interface MockAttempt {
  id: number;
  userId: number;
  startedAt: string;
  score: number;
  test: {
    id: number;
    title: string;
  };
}

export interface MockStore {
  users: MockUser[];
  groups: MockGroup[];
  courses: MockCourse[];
  books: MockBook[];
  vocabularies: MockVocabulary[];
  leads: MockLead[];
  attempts: MockAttempt[];
}

function cloneMockData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeMockRole(role: MockUserRole): MockRole {
  switch (role) {
    case 'SUPERADMIN':
      return 'superadmin';
    case 'ADMIN':
      return 'admin';
    case 'TEACHER':
      return 'teacher';
    default:
      return 'student';
  }
}

export function encodeMockToken(user: MockUser): string {
  const payload = {
    sub: String(user.id),
    id: user.id,
    role: normalizeMockRole(user.role),
    phone: user.phone,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const json = JSON.stringify(payload);
  const bufferCtor = (
    globalThis as typeof globalThis & {
      Buffer?: { from: (value: string, encoding: string) => { toString: (targetEncoding: string) => string } };
    }
  ).Buffer;
  const encoded =
    typeof window !== 'undefined' && typeof window.btoa === 'function'
      ? window.btoa(unescape(encodeURIComponent(json)))
      : bufferCtor
        ? bufferCtor.from(json, 'utf-8').toString('base64')
        : '';

  return `mock.${encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}.signature`;
}

const mockUsersSeed: MockUser[] = [
  {
    id: 1,
    fullName: 'Saida Rahimova',
    email: 'superadmin@mk-academy.uz',
    phone: '+998903333333',
    role: 'SUPERADMIN',
    password: 'super123',
    avatarUrl: null,
    cefrLevel: null,
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '1992-07-15',
    groupIds: [],
    createdAt: '2025-11-10T08:00:00.000Z',
    isActive: true,
  },
  {
    id: 2,
    fullName: 'Dilshod Karimov',
    email: 'admin@mk-academy.uz',
    phone: '+998902222222',
    role: 'ADMIN',
    password: 'admin123',
    avatarUrl: null,
    cefrLevel: null,
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '1995-04-21',
    groupIds: [],
    createdAt: '2025-12-02T09:20:00.000Z',
    isActive: true,
  },
  {
    id: 3,
    fullName: 'Maqsud Aliyev',
    email: 'mentor@mk-academy.uz',
    phone: '+998901111111',
    role: 'TEACHER',
    password: 'teacher123',
    avatarUrl: null,
    cefrLevel: 'C1',
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '1998-03-10',
    groupIds: [101, 102],
    createdAt: '2026-01-05T11:00:00.000Z',
    isActive: true,
  },
  {
    id: 4,
    fullName: 'Azizbek Nurmatov',
    email: 'student@mk-academy.uz',
    phone: '+998901234567',
    role: 'STUDENT',
    password: 'student123',
    avatarUrl: null,
    cefrLevel: 'B1',
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '2006-08-14',
    groupIds: [101],
    createdAt: '2026-02-01T10:15:00.000Z',
    isActive: true,
  },
  {
    id: 5,
    fullName: 'Shahzoda Yusupova',
    email: 'student2@mk-academy.uz',
    phone: '+998901234568',
    role: 'STUDENT',
    password: 'student123',
    avatarUrl: null,
    cefrLevel: 'A2',
    language: 'EN',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '2007-01-19',
    groupIds: [101],
    createdAt: '2026-02-10T09:05:00.000Z',
    isActive: true,
  },
  {
    id: 6,
    fullName: 'Bekzod Rasulov',
    email: 'student3@mk-academy.uz',
    phone: '+998901234569',
    role: 'STUDENT',
    password: 'student123',
    avatarUrl: null,
    cefrLevel: 'B2',
    language: 'RU',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '2005-11-03',
    groupIds: [102],
    createdAt: '2026-02-18T13:40:00.000Z',
    isActive: true,
  },
  {
    id: 7,
    fullName: 'Madina Sattorova',
    email: 'student4@mk-academy.uz',
    phone: '+998901234570',
    role: 'STUDENT',
    password: 'student123',
    avatarUrl: null,
    cefrLevel: 'B1',
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '2008-05-27',
    groupIds: [103],
    createdAt: '2026-03-01T07:30:00.000Z',
    isActive: true,
  },
  {
    id: 8,
    fullName: 'Nigina Tursunova',
    email: 'mentor2@mk-academy.uz',
    phone: '+998901111112',
    role: 'TEACHER',
    password: 'teacher123',
    avatarUrl: null,
    cefrLevel: 'C1',
    language: 'UZ',
    timezone: 'Asia/Tashkent',
    dateOfBirth: '1996-12-09',
    groupIds: [103],
    createdAt: '2026-01-14T15:00:00.000Z',
    isActive: true,
  },
];

const mockGroupsSeed: MockGroup[] = [
  {
    id: 101,
    name: 'IELTS Foundation',
    teacherId: 3,
    courseIds: [201, 202],
    inviteCode: 'MK-IELTS-A',
    nextLesson: 'Today 18:00',
    lessons: '12/30',
    _count: { members: 3 },
  },
  {
    id: 102,
    name: 'Grammar Booster',
    teacherId: 3,
    courseIds: [202, 203],
    inviteCode: 'MK-GRAM-B',
    nextLesson: 'Tomorrow 17:00',
    lessons: '7/18',
    _count: { members: 1 },
  },
  {
    id: 103,
    name: 'Speaking Club Pro',
    teacherId: 8,
    courseIds: [204],
    inviteCode: 'MK-SPK-C',
    nextLesson: 'Fri 19:30',
    lessons: '3/12',
    _count: { members: 1 },
  },
];

const mockCoursesSeed: MockCourse[] = [
  {
    id: 201,
    title: 'IELTS Foundation',
    level: 'B1',
    isActive: true,
    description:
      "IELTS uchun reading, listening, writing va speaking ko'nikmalarini bosqichma-bosqich rivojlantiradigan asosiy kurs.",
    groupIds: [101],
    tasks: [
      { id: 1001, title: 'Reading Strategies', type: 'TASK', dueDate: '2026-04-12T18:00:00.000Z' },
      { id: 1002, title: 'Writing Task 1 Practice', type: 'TASK', dueDate: '2026-04-14T18:00:00.000Z' },
      { id: 1003, title: 'Listening Note Completion', type: 'TASK', dueDate: '2026-04-15T18:00:00.000Z' },
      { id: 1009, title: 'Speaking Part 2 Outline', type: 'TASK', dueDate: '2026-04-17T18:00:00.000Z' },
    ],
    tests: [
      { id: 2001, title: 'IELTS Diagnostic Test', type: 'TEST' },
      { id: 2002, title: 'Reading Mock Exam', type: 'TEST' },
      { id: 2006, title: 'Listening Progress Check', type: 'TEST' },
    ],
    _count: { tasks: 4, tests: 3, groups: 1 },
  },
  {
    id: 202,
    title: 'Grammar Booster',
    level: 'A2-B1',
    isActive: true,
    description:
      "Asosiy grammatika mavzularini tushunarli darslar va mashqlar bilan mustahkamlash uchun tuzilgan kurs.",
    groupIds: [101, 102],
    tasks: [
      { id: 1004, title: 'Present Simple vs Continuous', type: 'TASK', dueDate: '2026-04-13T16:00:00.000Z' },
      { id: 1005, title: 'Past Tense Transformation', type: 'TASK', dueDate: '2026-04-16T16:00:00.000Z' },
      { id: 1010, title: 'Articles and Determiners', type: 'TASK', dueDate: '2026-04-19T16:00:00.000Z' },
      { id: 1011, title: 'Conditionals Practice', type: 'TASK', dueDate: '2026-04-21T16:00:00.000Z' },
    ],
    tests: [
      { id: 2003, title: 'Grammar Checkpoint', type: 'TEST' },
      { id: 2007, title: 'Unit Grammar Exam', type: 'TEST' },
    ],
    _count: { tasks: 4, tests: 2, groups: 2 },
  },
  {
    id: 203,
    title: 'Vocabulary Sprint',
    level: 'B1-B2',
    isActive: false,
    description:
      "Academic va daily use vocabulary zaxirasini tez kengaytirish uchun micro-lesson formatidagi kurs.",
    groupIds: [102],
    tasks: [
      { id: 1006, title: 'Academic Word List Set 1', type: 'TASK', dueDate: '2026-04-20T12:00:00.000Z' },
    ],
    tests: [{ id: 2004, title: 'Vocabulary Retention Quiz', type: 'TEST' }],
    _count: { tasks: 1, tests: 1, groups: 1 },
  },
  {
    id: 204,
    title: 'Speaking Club Pro',
    level: 'B2',
    isActive: true,
    description:
      "Speaking confidence, fluency va presentation skill ustida ishlash uchun practice-heavy kurs.",
    groupIds: [103],
    tasks: [
      { id: 1007, title: 'Opinion Essay Speaking', type: 'TASK', dueDate: '2026-04-18T19:00:00.000Z' },
      { id: 1008, title: 'Storytelling Practice', type: 'TASK', dueDate: '2026-04-22T19:00:00.000Z' },
    ],
    tests: [{ id: 2005, title: 'Fluency Evaluation', type: 'TEST' }],
    _count: { tasks: 2, tests: 1, groups: 1 },
  },
];

const mockBooksSeed: MockBook[] = [
  {
    id: 301,
    title: 'English Grammar in Use',
    author: 'Raymond Murphy',
    category: 'GRAMMAR',
    coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
    cefrLevel: 'B1',
    pages: 380,
  },
  {
    id: 302,
    title: 'Oxford Word Skills',
    author: 'Ruth Gairns',
    category: 'ACADEMIC',
    coverImageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
    cefrLevel: 'B2',
    pages: 255,
  },
  {
    id: 303,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'FICTION',
    coverImageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
    cefrLevel: 'B1',
    pages: 320,
  },
  {
    id: 304,
    title: 'Cambridge IELTS 17',
    author: 'Cambridge Press',
    category: 'ACADEMIC',
    coverImageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
    cefrLevel: 'B2',
    pages: 190,
  },
  {
    id: 305,
    title: 'Grammar Practice for Intermediate',
    author: 'Lynne Truss',
    category: 'GRAMMAR',
    coverImageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80',
    cefrLevel: 'B1',
    pages: 214,
  },
  {
    id: 306,
    title: 'Short Stories in English',
    author: 'Olly Richards',
    category: 'FICTION',
    coverImageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80',
    cefrLevel: 'A2',
    pages: 176,
  },
  {
    id: 307,
    title: 'Essential Grammar in Use',
    author: 'Raymond Murphy',
    category: 'GRAMMAR',
    coverImageUrl: 'https://images.unsplash.com/photo-1511108690759-009324a90311?w=600&q=80',
    cefrLevel: 'A2',
    pages: 300,
  },
  {
    id: 308,
    title: 'Advanced Grammar in Use',
    author: 'Martin Hewings',
    category: 'GRAMMAR',
    coverImageUrl: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=600&q=80',
    cefrLevel: 'C1',
    pages: 294,
  },
];

const mockVocabulariesSeed: MockVocabulary[] = [
  {
    id: 401,
    unitId: 1,
    courseId: 201,
    word: 'consistent',
    translation: 'barqaror',
    pronunciation: '/kənˈsɪstənt/',
    exampleSentence: 'She made consistent progress during the semester.',
  },
  {
    id: 402,
    unitId: 1,
    courseId: 201,
    word: 'achieve',
    translation: 'erishmoq',
    pronunciation: '/əˈtʃiːv/',
    exampleSentence: 'He wants to achieve a higher IELTS score this year.',
  },
  {
    id: 403,
    unitId: 1,
    courseId: 201,
    word: 'accurate',
    translation: 'aniq',
    pronunciation: '/ˈækjərət/',
    exampleSentence: 'Your answers must be accurate and complete.',
  },
  {
    id: 404,
    unitId: 2,
    courseId: 202,
    word: 'attempt',
    translation: 'urinish',
    pronunciation: '/əˈtempt/',
    exampleSentence: 'This was her third attempt at the mock exam.',
  },
  {
    id: 405,
    unitId: 2,
    courseId: 202,
    word: 'guideline',
    translation: "qo'llanma",
    pronunciation: '/ˈɡaɪdlaɪn/',
    exampleSentence: 'Follow the writing guideline carefully.',
  },
  {
    id: 406,
    unitId: 2,
    courseId: 202,
    word: 'retention',
    translation: 'esda saqlash',
    pronunciation: '/rɪˈtenʃn/',
    exampleSentence: 'Flashcards improve vocabulary retention.',
  },
  {
    id: 407,
    unitId: 3,
    courseId: 202,
    word: 'clarify',
    translation: 'aniqlashtirmoq',
    pronunciation: '/ˈklærəfaɪ/',
    exampleSentence: 'The teacher clarified the grammar rule with examples.',
  },
  {
    id: 408,
    unitId: 3,
    courseId: 202,
    word: 'fluency',
    translation: 'ravonlik',
    pronunciation: '/ˈfluːənsi/',
    exampleSentence: 'Daily practice builds speaking fluency.',
  },
  {
    id: 409,
    unitId: 2,
    courseId: 202,
    word: 'article',
    translation: 'artikl',
    pronunciation: '/ˈɑːrtɪkl/',
    exampleSentence: 'Use the correct article before singular nouns.',
  },
  {
    id: 410,
    unitId: 2,
    courseId: 202,
    word: 'conditional',
    translation: 'shart mayli',
    pronunciation: '/kənˈdɪʃənəl/',
    exampleSentence: 'Conditional sentences show possible situations.',
  },
  {
    id: 411,
    unitId: 3,
    courseId: 202,
    word: 'determiner',
    translation: "aniqlovchi so'z",
    pronunciation: '/dɪˈtɜːrmɪnər/',
    exampleSentence: 'A determiner comes before a noun.',
  },
  {
    id: 412,
    unitId: 1,
    courseId: 201,
    word: 'cohesion',
    translation: "bog'liqlik",
    pronunciation: '/kəʊˈhiːʒn/',
    exampleSentence: 'Good cohesion makes your writing easier to follow.',
  },
];

const mockLeadsSeed: MockLead[] = [
  {
    id: 501,
    fullName: 'Zafar Ibrohimov',
    phone: '+998991234567',
    message: "IELTS preparation group haqida ma'lumot kerak.",
    answer:
      "IELTS Foundation guruhlarida reading, listening, writing va speaking haftasiga 3 marta o'tiladi. Dastlab diagnostic test orqali darajangiz aniqlanadi.",
    isPublished: true,
    answeredAt: '2026-04-08T10:20:00.000Z',
    status: 'NEW',
    createdAt: '2026-04-07T08:40:00.000Z',
  },
  {
    id: 502,
    fullName: 'Malika Ergasheva',
    phone: '+998971112233',
    message: "Farzandim uchun beginner group qidiryapman.",
    answer:
      "Beginner guruhlar A1 darajadan boshlanadi. Darslar bolalar va o'smirlar uchun alohida metodika bilan olib boriladi.",
    isPublished: true,
    answeredAt: '2026-04-07T09:30:00.000Z',
    status: 'CONTACTED',
    createdAt: '2026-04-06T14:10:00.000Z',
  },
  {
    id: 503,
    fullName: 'Jamshid Turgunov',
    phone: '+998901234100',
    message: "Speaking club schedule qiziqtiryapti.",
    answer: "Speaking Club Pro haftada 2 marta kechki payt o'tiladi va har darsda real dialog, debate hamda IELTS speaking formatlari mashq qilinadi.",
    isPublished: true,
    answeredAt: '2026-04-06T11:10:00.000Z',
    status: 'ENROLLED',
    createdAt: '2026-04-05T12:05:00.000Z',
  },
  {
    id: 504,
    fullName: 'Nodira Qodirova',
    phone: '+998933336699',
    message: "Faqat online format bormi?",
    answer: null,
    isPublished: false,
    answeredAt: null,
    status: 'REJECTED',
    createdAt: '2026-04-03T09:15:00.000Z',
  },
];

const mockAttemptsSeed: MockAttempt[] = [
  {
    id: 701,
    userId: 4,
    startedAt: '2026-04-07T09:00:00.000Z',
    score: 92,
    test: { id: 2001, title: 'IELTS Diagnostic Test' },
  },
  {
    id: 702,
    userId: 4,
    startedAt: '2026-04-05T11:15:00.000Z',
    score: 87,
    test: { id: 2002, title: 'Reading Mock Exam' },
  },
  {
    id: 703,
    userId: 5,
    startedAt: '2026-04-04T14:25:00.000Z',
    score: 79,
    test: { id: 2003, title: 'Grammar Checkpoint' },
  },
  {
    id: 704,
    userId: 6,
    startedAt: '2026-04-02T17:05:00.000Z',
    score: 84,
    test: { id: 2004, title: 'Vocabulary Retention Quiz' },
  },
  {
    id: 705,
    userId: 7,
    startedAt: '2026-04-01T19:40:00.000Z',
    score: 90,
    test: { id: 2005, title: 'Fluency Evaluation' },
  },
];

export const mockLoginPresets = mockUsersSeed.map((user) => ({
  role: normalizeMockRole(user.role),
  fullName: user.fullName,
  phone: user.phone,
  password: user.password,
}));

export function createInitialMockStore(): MockStore {
  return cloneMockData({
    users: mockUsersSeed,
    groups: mockGroupsSeed,
    courses: mockCoursesSeed,
    books: mockBooksSeed,
    vocabularies: mockVocabulariesSeed,
    leads: mockLeadsSeed,
    attempts: mockAttemptsSeed,
  });
}
