import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
  createInitialMockStore,
  encodeMockToken,
  normalizeMockRole,
  type MockCourse,
  type MockLead,
  type MockUser,
} from '@/mocks/mock-data';

type RequestConfig = InternalAxiosRequestConfig & {
  data?: unknown;
};

const MOCK_LATENCY_MS = 80;

let store = createInitialMockStore();

export function isMockApiEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}

export function resetMockApiStore() {
  store = createInitialMockStore();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function parseRequestData<T>(config: RequestConfig): T {
  const { data } = config;

  if (!data) {
    return {} as T;
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return {} as T;
    }
  }

  return data as T;
}

function readHeader(config: RequestConfig, name: string) {
  const headers = config.headers as
    | ({ get?: (headerName: string) => string | null | undefined } & Record<string, string | undefined>)
    | undefined;

  if (!headers) return null;

  if (typeof headers.get === 'function') {
    return headers.get(name) ?? headers.get(name.toLowerCase()) ?? null;
  }

  return headers[name] ?? headers[name.toLowerCase()] ?? null;
}

function resolveUrl(config: RequestConfig) {
  const rawUrl = config.url || '/';
  const base = config.baseURL || 'https://mock.local/api/';
  const url = /^https?:\/\//.test(rawUrl)
    ? new URL(rawUrl)
    : new URL(rawUrl.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`);

  if (config.params && typeof config.params === 'object') {
    for (const [key, value] of Object.entries(config.params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  let pathname = url.pathname;
  if (pathname === '/api') pathname = '/';
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4);
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

  return { url, pathname };
}

function makeResponse<T>(config: RequestConfig, data: T, status = 200, statusText = 'OK'): AxiosResponse<T> {
  return {
    data,
    status,
    statusText,
    headers: {},
    config,
    request: { mocked: true },
  };
}

function makeError(config: RequestConfig, status: number, message: string) {
  const response = makeResponse(config, { message }, status, status >= 400 ? 'ERROR' : 'OK');
  return new AxiosError(message, String(status), config, undefined, response);
}

function getDefaultUser() {
  return store.users.find((user) => user.role === 'STUDENT') || store.users[0];
}

function getCurrentUser(config: RequestConfig) {
  const authHeader = readHeader(config, 'Authorization');

  if (!authHeader) {
    return getDefaultUser();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = token.split('.')[1];

  if (!payload) {
    return getDefaultUser();
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bufferCtor = (
      globalThis as typeof globalThis & {
        Buffer?: { from: (value: string, encoding: string) => { toString: (targetEncoding: string) => string } };
      }
    ).Buffer;
    const decoded =
      typeof window !== 'undefined' && typeof window.atob === 'function'
        ? decodeURIComponent(
            atob(normalized)
              .split('')
              .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
              .join(''),
          )
        : bufferCtor
          ? bufferCtor.from(normalized, 'base64').toString('utf-8')
          : '';

    const parsed = JSON.parse(decoded) as { id?: number };
    return store.users.find((user) => user.id === parsed.id) || getDefaultUser();
  } catch {
    return getDefaultUser();
  }
}

function getStudentUsers() {
  return store.users.filter((user) => user.role === 'STUDENT');
}

function getTeacherUsers() {
  return store.users.filter((user) => user.role === 'TEACHER');
}

function getGroupsForUser(user: MockUser) {
  const role = normalizeMockRole(user.role);

  if (role === 'superadmin' || role === 'admin') {
    return store.groups;
  }

  if (role === 'teacher' || role === 'mentor') {
    return store.groups.filter((group) => group.teacherId === user.id);
  }

  return store.groups.filter((group) => user.groupIds.includes(group.id));
}

function getCoursesForUser(user: MockUser) {
  const role = normalizeMockRole(user.role);

  if (role === 'superadmin' || role === 'admin') {
    return store.courses;
  }

  const groupIds = getGroupsForUser(user).map((group) => group.id);
  return store.courses.filter((course) => course.groupIds.some((groupId) => groupIds.includes(groupId)));
}

function getUsersForRole(user: MockUser, scope: 'default' | 'superadmin' | 'admin' | 'teacher' = 'default') {
  if (scope === 'superadmin') {
    return store.users;
  }

  if (scope === 'admin') {
    return store.users.filter((item) => item.role === 'STUDENT' || item.role === 'TEACHER');
  }

  if (scope === 'teacher') {
    const teacherGroups = getGroupsForUser(user).map((group) => group.id);
    return getStudentUsers().filter((student) => student.groupIds.some((groupId) => teacherGroups.includes(groupId)));
  }

  const role = normalizeMockRole(user.role);

  if (role === 'superadmin') {
    return store.users;
  }

  if (role === 'admin') {
    return store.users.filter((item) => item.role !== 'SUPERADMIN');
  }

  if (role === 'teacher' || role === 'mentor') {
    return getUsersForRole(user, 'teacher');
  }

  return [user];
}

function mapProfile(user: MockUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    cefrLevel: user.cefrLevel,
    language: user.language,
    timezone: user.timezone,
    dateOfBirth: user.dateOfBirth,
  };
}

function getStudentCountForCourse(course: MockCourse) {
  return getStudentUsers().filter((student) => student.groupIds.some((groupId) => course.groupIds.includes(groupId))).length;
}

function getTasksForUser(user: MockUser) {
  return getCoursesForUser(user).flatMap((course) =>
    course.tasks.map((task) => ({
      ...task,
      course: { id: course.id, title: course.title },
      _count: { studentTasks: getStudentCountForCourse(course) },
    })),
  );
}

function getAttemptsForUser(user: MockUser) {
  const role = normalizeMockRole(user.role);

  if (role === 'superadmin' || role === 'admin') {
    return store.attempts;
  }

  if (role === 'teacher' || role === 'mentor') {
    const studentIds = getUsersForRole(user, 'teacher').map((student) => student.id);
    return store.attempts.filter((attempt) => studentIds.includes(attempt.userId));
  }

  return store.attempts.filter((attempt) => attempt.userId === user.id);
}

function buildSystemPayload() {
  const totalStudents = getStudentUsers().length;
  const totalTeachers = getTeacherUsers().length;

  const auditLogs = [
    {
      type: 'DEPLOY',
      title: 'Frontend mock data adapter enabled',
      time: '5 min ago',
      status: 'Success',
    },
    {
      type: 'LEAD',
      title: `${store.leads.filter((lead) => lead.status === 'CONTACTED').length} ta murojaatga javob berildi`,
      time: '20 min ago',
      status: 'Success',
    },
    {
      type: 'ALERT',
      title: `${store.leads.filter((lead) => lead.status === 'NEW').length} ta yangi lead kutmoqda`,
      time: '45 min ago',
      status: 'Warning',
    },
  ];

  return {
    system: {
      cpuUsage: 18.4,
      ramFree: 12.6,
      ramTotal: 32,
      diskSpace: 418,
      networkMs: 42,
      uptime: 99.98,
      platform: 'linux',
      arch: 'x64',
    },
    summary: {
      totalUsers: store.users.length,
      totalStudents,
      totalTeachers,
      totalGroups: store.groups.length,
      totalCourses: store.courses.length,
      totalLeads: store.leads.length,
    },
    auditLogs,
  };
}

function buildDashboardPayload(user: MockUser) {
  const role = normalizeMockRole(user.role);
  const groups = getGroupsForUser(user);
  const courses = getCoursesForUser(user);
  const attempts = getAttemptsForUser(user);
  const system = buildSystemPayload();

  if (role === 'superadmin') {
    return {
      subscribers: getStudentUsers().length,
      totalUsers: store.users.length,
      totalStudents: getStudentUsers().length,
      totalTeachers: getTeacherUsers().length,
      totalAdmins: store.users.filter((item) => item.role === 'ADMIN').length,
      totalCourses: store.courses.length,
      totalGroups: store.groups.length,
      system: system.system,
      auditLogs: system.auditLogs.map((log) => ({
        ...log,
        time: log.time,
      })),
    };
  }

  if (role === 'admin') {
    return {
      totalStudents: getStudentUsers().length,
      totalTeachers: getTeacherUsers().length,
      activeGroups: store.groups.length,
      totalCourses: store.courses.length,
      recentRegistrations: store.users.filter((item) => item.role === 'STUDENT').slice(-3).length,
      averageResult:
        attempts.length > 0
          ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
          : 88,
      pendingTasks: store.courses.reduce((sum, course) => sum + course.tasks.length, 0),
    };
  }

  if (role === 'teacher' || role === 'mentor') {
    return {
      activeGroups: groups.length,
      pendingHomeworks: getTasksForUser(user).length,
      myGroups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        students: getStudentUsers().filter((student) => student.groupIds.includes(group.id)).length,
        lessons: group.lessons,
        nextLesson: group.nextLesson,
      })),
      myCourses: courses.length,
    };
  }

  const studentAttempts = store.attempts.filter((attempt) => attempt.userId === user.id);
  const averageScore =
    studentAttempts.length > 0
      ? Math.round(studentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / studentAttempts.length)
      : 0;

  return {
    progress: 62,
    streak: 7,
    rank: '#2',
    accuracy: averageScore || 94,
    completedTasks: Math.min(getTasksForUser(user).length, 12),
    totalTasks: Math.max(getTasksForUser(user).length * 2, 18),
    myGroups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      teacherName: store.users.find((teacher) => teacher.id === group.teacherId)?.fullName || 'Mentor',
      students: getStudentUsers().filter((student) => student.groupIds.includes(group.id)).length,
      lessons: group.lessons,
      nextLesson: group.nextLesson,
    })),
  };
}

function filterBySearch<T extends { fullName?: string; name?: string; title?: string }>(items: T[], query: string | null) {
  const trimmed = query?.trim().toLowerCase();
  if (!trimmed) return items;

  return items.filter((item) => {
    const haystack = [item.fullName, item.name, item.title].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(trimmed);
  });
}

function getCourseById(id: number) {
  return store.courses.find((course) => course.id === id) || null;
}

async function handleRequest(config: RequestConfig) {
  const { url, pathname } = resolveUrl(config);
  const method = (config.method || 'get').toLowerCase();
  const currentUser = getCurrentUser(config);
  const segments = pathname.split('/').filter(Boolean);

  if (method === 'post' && pathname === '/auth/login') {
    const body = parseRequestData<{ phone?: string; password?: string }>(config);
    const phone = normalizePhone(body.phone || '');
    const password = body.password || '';
    const user = store.users.find(
      (item) => normalizePhone(item.phone) === phone && item.password === password && item.isActive,
    );

    if (!user) {
      throw makeError(config, 401, 'Phone and password do not found');
    }

    return makeResponse(config, {
      access_token: encodeMockToken(user),
      user: {
        id: user.id,
        role: normalizeMockRole(user.role),
        fullName: user.fullName,
      },
    });
  }

  if (method === 'get' && pathname === '/dashboard/stats') {
    return makeResponse(config, buildDashboardPayload(currentUser));
  }

  if (method === 'get' && pathname === '/users') {
    const users = filterBySearch(getUsersForRole(currentUser), url.searchParams.get('fullName'));
    return makeResponse(config, users);
  }

  if (method === 'get' && pathname === '/users/superAdmin/getAllRoles') {
    const users = filterBySearch(getUsersForRole(currentUser, 'superadmin'), url.searchParams.get('fullName'));
    return makeResponse(config, users);
  }

  if (method === 'get' && pathname === '/users/admin/getAll_Students_And_Techers') {
    const users = filterBySearch(getUsersForRole(currentUser, 'admin'), url.searchParams.get('fullName'));
    return makeResponse(config, users);
  }

  if (method === 'get' && pathname === '/users/teacher/getAll_Students') {
    const users = filterBySearch(getUsersForRole(currentUser, 'teacher'), url.searchParams.get('fullName'));
    return makeResponse(config, users);
  }

  if (method === 'get' && pathname === '/users/profile') {
    return makeResponse(config, mapProfile(currentUser));
  }

  if (method === 'patch' && pathname === '/users/profile') {
    const body = parseRequestData<{ fullName?: string }>(config);
    const target = store.users.find((user) => user.id === currentUser.id);

    if (!target) {
      throw makeError(config, 404, 'User not found');
    }

    if (body.fullName?.trim()) {
      target.fullName = body.fullName.trim();
    }

    return makeResponse(config, mapProfile(target));
  }

  if (method === 'get' && pathname === '/user-profiles/profile/me') {
    return makeResponse(config, mapProfile(currentUser));
  }

  if (method === 'put' && pathname === '/user-profiles/profile/update') {
    const body = parseRequestData<{ fullName?: string }>(config);
    const target = store.users.find((user) => user.id === currentUser.id);

    if (!target) {
      throw makeError(config, 404, 'User not found');
    }

    if (body.fullName?.trim()) {
      target.fullName = body.fullName.trim();
    }

    return makeResponse(config, mapProfile(target));
  }

  if (method === 'get' && pathname === '/groups') {
    const groups = filterBySearch(getGroupsForUser(currentUser), url.searchParams.get('name'));
    return makeResponse(config, groups);
  }

  if (method === 'get' && pathname === '/tasks') {
    return makeResponse(config, getTasksForUser(currentUser));
  }

  if (method === 'get' && pathname === '/courses/my-learning') {
    const courses = getCoursesForUser(currentUser).filter((course) => course.isActive);
    return makeResponse(config, courses);
  }

  if (method === 'get' && pathname === '/courses') {
    return makeResponse(config, getCoursesForUser(currentUser));
  }

  if (method === 'get' && segments[0] === 'courses' && segments[1]) {
    const courseId = Number(segments[1]);
    const course = getCourseById(courseId);

    if (!course) {
      throw makeError(config, 404, 'Course not found');
    }

    return makeResponse(config, course);
  }

  if (method === 'get' && pathname === '/books') {
    const category = url.searchParams.get('category');
    const cefrLevel = url.searchParams.get('cefrLevel');
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const books = store.books.filter((book) => {
      if (category && book.category !== category) return false;
      if (cefrLevel && book.cefrLevel !== cefrLevel) return false;
      if (search && !`${book.title} ${book.author}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return makeResponse(config, books);
  }

  if (method === 'post' && pathname === '/books') {
    const body = parseRequestData<any>(config);
    const readValue = (key: string) =>
      typeof FormData !== 'undefined' && body instanceof FormData ? String(body.get(key) || '') : String(body?.[key] || '');
    const book = {
      id: Math.max(...store.books.map((item) => item.id), 400) + 1,
      title: readValue('title') || 'Yangi kitob',
      author: readValue('author') || 'MK Academy',
      category: 'ACADEMIC' as const,
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      cefrLevel: readValue('cefrLevel') || 'A1',
      pages: 0,
    };
    store.books.unshift(book);
    return makeResponse(config, book, 201, 'Created');
  }

  if (method === 'get' && segments[0] === 'books' && segments[1]) {
    const bookId = Number(segments[1]);
    const book = store.books.find((item) => item.id === bookId);

    if (!book) {
      throw makeError(config, 404, 'Book not found');
    }

    return makeResponse(config, book);
  }

  if (method === 'get' && (pathname === '/vocabularies' || pathname === '/vocabularies/get-all')) {
    const unitId = Number(url.searchParams.get('unitId') || 0);
    const courseId = Number(url.searchParams.get('courseId') || 0);

    const vocabularies = store.vocabularies.filter((item) => {
      if (unitId && item.unitId !== unitId) return false;
      if (courseId && item.courseId !== courseId) return false;
      return true;
    });

    return makeResponse(config, vocabularies);
  }

  if (method === 'get' && pathname === '/tests/my-attempts') {
    return makeResponse(config, getAttemptsForUser(currentUser));
  }

  if (method === 'get' && pathname === '/system/stats') {
    return makeResponse(config, buildSystemPayload());
  }

  if (method === 'get' && pathname === '/system/health') {
    return makeResponse(config, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  if (method === 'get' && pathname === '/leads') {
    return makeResponse(config, [...store.leads].sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
  }

  if (method === 'get' && pathname === '/leads/public/questions') {
    const questions = store.leads
      .filter((lead) => lead.isPublished && lead.message && lead.answer)
      .sort((left, right) => (right.answeredAt || right.createdAt).localeCompare(left.answeredAt || left.createdAt))
      .map(({ id, fullName, message, answer, answeredAt, createdAt }) => ({
        id,
        fullName,
        message,
        answer,
        answeredAt,
        createdAt,
      }));

    return makeResponse(config, questions);
  }

  if (method === 'post' && pathname === '/leads') {
    const body = parseRequestData<{ fullName?: string; phone?: string; message?: string }>(config);
    const lead: MockLead = {
      id: Math.max(...store.leads.map((item) => item.id), 500) + 1,
      fullName: body.fullName?.trim() || 'Yangi lead',
      phone: body.phone?.trim() || '+998000000000',
      message: body.message?.trim() || '',
      answer: null,
      isPublished: false,
      answeredAt: null,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };

    store.leads.unshift(lead);
    return makeResponse(config, lead, 201, 'Created');
  }

  if (method === 'patch' && segments[0] === 'leads' && segments[1] && segments[2] === 'status') {
    const leadId = Number(segments[1]);
    const body = parseRequestData<{ status?: MockLead['status'] }>(config);
    const lead = store.leads.find((item) => item.id === leadId);

    if (!lead) {
      throw makeError(config, 404, 'Lead not found');
    }

    if (body.status) {
      lead.status = body.status;
    }

    return makeResponse(config, lead);
  }

  if (method === 'patch' && segments[0] === 'leads' && segments[1] && segments[2] === 'answer') {
    const leadId = Number(segments[1]);
    const body = parseRequestData<{ answer?: string; isPublished?: boolean }>(config);
    const lead = store.leads.find((item) => item.id === leadId);

    if (!lead) {
      throw makeError(config, 404, 'Lead not found');
    }

    lead.answer = body.answer?.trim() || '';
    lead.isPublished = body.isPublished ?? true;
    lead.answeredAt = new Date().toISOString();
    if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
    }

    return makeResponse(config, lead);
  }

  if (method === 'delete' && segments[0] === 'leads' && segments[1]) {
    const leadId = Number(segments[1]);
    store.leads = store.leads.filter((item) => item.id !== leadId);
    return makeResponse(config, { success: true });
  }

  if (method === 'get' && pathname === '/auth/me') {
    return makeResponse(config, {
      id: currentUser.id,
      role: normalizeMockRole(currentUser.role),
      fullName: currentUser.fullName,
      phone: currentUser.phone,
      email: currentUser.email,
    });
  }

  throw makeError(config, 404, `Cannot ${method.toUpperCase()} ${pathname}`);
}

export const mockApiAdapter: AxiosAdapter = async (config) => {
  const typedConfig = config as RequestConfig;
  await wait(MOCK_LATENCY_MS);

  try {
    return await handleRequest(typedConfig);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw error;
    }

    throw makeError(typedConfig, 500, 'Mock API internal error');
  }
};
