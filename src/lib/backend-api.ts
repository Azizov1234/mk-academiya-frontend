import api from "@/lib/api";

export type AppRole = 'superadmin' | 'admin' | 'teacher' | 'mentor' | 'student' | 'global_user';
export type UserDirectoryRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'GLOBAL_USER';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PublicExamMode = 'LEVEL' | 'TRACK';
export type PublicExamDirection =
  | 'VOCABULARY'
  | 'WRITING'
  | 'SPEAKING'
  | 'READING'
  | 'LISTENING'
  | 'GRAMMAR';
export type TaskType =
  | "READING"
  | "WRITING"
  | "LISTENING"
  | "SPEAKING"
  | "GRAMMAR"
  | "VOCABULARY"
  | "TEST";
export type LeadStatus = "NEW" | "CONTACTED" | "ENROLLED" | "REJECTED";

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const PUBLIC_EXAM_MODES: PublicExamMode[] = ['LEVEL', 'TRACK'];
export const PUBLIC_EXAM_DIRECTIONS: PublicExamDirection[] = [
  'VOCABULARY',
  'WRITING',
  'SPEAKING',
  'READING',
  'LISTENING',
  'GRAMMAR',
];
export const TASK_TYPES: TaskType[] = [
  "READING",
  "WRITING",
  "LISTENING",
  "SPEAKING",
  "GRAMMAR",
  "VOCABULARY",
  "TEST",
];

type RequestStrategy = "scoped" | "role-specific";

type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type UserListQuery = ListQuery & {
  fullName?: string;
  GroupName?: string;
  user?: UserDirectoryRole;
  isActive?: boolean;
};

export type CourseListQuery = ListQuery & {
  level?: CefrLevel;
};

export type ProfileUpdatePayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  dateOfBirth?: string;
  language?: string;
  avatarUrl?: File | null;
};

export type UserCreatePayload = {
  phone: string;
  passwordHash: string;
  fullName: string;
  cefrLevel?: CefrLevel | "";
  avatarUrl?: File | null;
};

export type UserUpdatePayload = {
  phone?: string;
  passwordHash?: string;
  fullName?: string;
  cefrLevel?: CefrLevel | "";
  avatarUrl?: string | null;
  isActive?: boolean;
};

export type CoursePayload = {
  title: string;
  level: CefrLevel;
  description?: string;
  imageUrl?: File | null;
  isActive?: boolean;
};

export type GroupPayload = {
  name: string;
  description?: string;
  teacherId: number;
  inviteCode: string;
};

export type BookPayload = {
  title: string;
  author?: string;
  description?: string;
  cefrLevel?: CefrLevel | "";
  coverImage?: File | null;
  bookFile?: File | null;
  coverImageUrl?: string;
  fileUrl?: string;
  isActive?: boolean;
};

export type TaskPayload = {
  title: string;
  description?: string;
  type: TaskType;
  xpReward: number;
  courseId?: number | null;
};

export type TestPayload = {
  title: string;
  description?: string;
  type?: string;
  cefrLevel?: CefrLevel | "";
  duration?: number;
  timeLimitMinutes?: number;
  passingScore: number;
  courseId?: number | null;
  shuffleQuestions?: boolean;
  maxAttempts?: number | null;
  isAdaptive?: boolean;
  isPublished?: boolean;
  isPublicExam?: boolean;
  publicExamType?: PublicExamMode | '';
  publicExamDirection?: PublicExamDirection | '';
  questions?: TestQuestionPayload[];
};

export type TestQuestionPayload = {
  type?: string;
  inputType?: string;
  questionText: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string;
  points?: number;
  difficulty?: number;
  skill?: string;
};

export type QuestionOption = {
  label: string;
  value: string;
};

export type TestListQuery = ListQuery & {
  courseId?: number | null;
  cefrLevel?: CefrLevel | "";
  type?: string;
  isPublished?: boolean | '';
  isActive?: boolean | '';
  isPublicExam?: boolean | '';
  publicExamType?: PublicExamMode | '';
  publicExamDirection?: PublicExamDirection | '';
};

export type TestAttemptSubmitPayload = {
  testId?: number;
  attemptId?: number;
  answers?: Record<string, unknown> | Array<Record<string, unknown>>;
  timeSpentSeconds?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  studentId?: number;
};

export type TestQuestion = {
  id: number;
  testId?: number;
  type?: string;
  inputType?: string;
  questionText: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  points?: number;
  difficulty?: number;
  skill?: string | null;
  isActive?: boolean;
};

export type TestItem = {
  id: number;
  title: string;
  description?: string | null;
  type?: string;
  cefrLevel?: CefrLevel | string | null;
  duration?: number | null;
  timeLimitMinutes?: number | null;
  timeLimit?: number | null;
  passingScore?: number;
  courseId?: number | null;
  shuffleQuestions?: boolean;
  maxAttempts?: number | null;
  isAdaptive?: boolean;
  isPublished?: boolean;
  isPublicExam?: boolean;
  publicExamType?: PublicExamMode | string | null;
  publicExamDirection?: PublicExamDirection | string | null;
  isActive?: boolean;
  course?: { id: number; title: string; level?: string | null } | null;
  createdBy?: {
    id: number;
    fullName?: string | null;
    role?: string | null;
  } | null;
  questions?: TestQuestion[];
  _count?: { questions?: number; attempts?: number };
};

export type PublicExamCatalogItem = {
  id: number;
  title: string;
  description?: string | null;
  type?: string | null;
  cefrLevel?: string | null;
  publicExamType?: PublicExamMode | string | null;
  publicExamDirection?: PublicExamDirection | string | null;
  passingScore?: number;
  duration?: number | null;
  questionCount?: number;
};

export type PublicExamCatalogResponse = {
  data: PublicExamCatalogItem[];
  filters: {
    modes: PublicExamMode[];
    levels: string[];
    directions: string[];
  };
};

export type PublicExamSubmitPayload = {
  participantName: string;
  selectedMode: PublicExamMode;
  selectedLevel?: CefrLevel;
  selectedDirection?: PublicExamDirection;
  answers: Record<string, unknown> | Array<Record<string, unknown>>;
  timeSpentSeconds?: number;
};

export type PublicExamResult = {
  id: number;
  participantName: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  estimatedLevel?: string | null;
  selectedMode: string;
  selectedLevel?: string | null;
  selectedDirection?: string | null;
  rank?: number;
  submittedAt?: string;
  test?: {
    id: number;
    title: string;
    cefrLevel?: string | null;
    publicExamType?: string | null;
    publicExamDirection?: string | null;
  };
};

export type PublicExamRatingItem = {
  rank: number;
  participantName: string;
  level?: string | null;
  selectedMode?: string | null;
  selectedLevel?: string | null;
  selectedDirection?: string | null;
  percentage: number;
  score: number;
  maxScore: number;
  testId?: number;
  testTitle?: string | null;
  submittedAt?: string;
};

export type TestAttempt = {
  id: number;
  studentId: number;
  testId: number;
  startedAt: string;
  submittedAt?: string | null;
  score?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  timeSpentSeconds?: number | null;
  answers?: any;
  feedback?: any;
  test?: {
    id: number;
    title: string;
    type?: string;
    passingScore?: number;
    timeLimitMinutes?: number | null;
  };
  student?: {
    id: number;
    fullName?: string | null;
    role?: string | null;
  };
};

export type LeadPayload = {
  fullName: string;
  phone: string;
  message?: string;
};

export type LeadItem = LeadPayload & {
  id: number;
  status: LeadStatus;
  answer?: string | null;
  isPublished?: boolean;
  answeredAt?: string | null;
  createdAt?: string;
};

export type PublicLeadQuestion = {
  id: number;
  fullName?: string | null;
  message?: string | null;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt?: string | null;
};

export type LeadAnswerPayload = {
  answer: string;
  isPublished?: boolean;
};

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
  isActive?: boolean;
};

export type NotificationFeed = {
  items: AppNotification[];
  unreadCount: number;
};

function normalizeRole(role?: string | null): AppRole {
  const value = role?.toLowerCase();
  if (
    value === 'superadmin' ||
    value === 'admin' ||
    value === 'teacher' ||
    value === 'mentor' ||
    value === 'global_user'
  ) {
    return value;
  }
  return "student";
}

function unwrapApiData<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function normalizeListQuery(query: ListQuery) {
  const params: Record<string, unknown> = {};

  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;
  if (query.search?.trim()) params.search = query.search.trim();

  return params;
}

function createFormData(payload: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");
  return unwrapApiData<any>(response.data);
}

export async function getSystemHealth() {
  const response = await api.get("/system/health");
  return unwrapApiData<any>(response.data);
}

export async function getSystemStats() {
  const response = await api.get("/system/stats");
  return unwrapApiData<any>(response.data);
}

export async function listUsersScoped(query: UserListQuery = {}) {
  const params: Record<string, unknown> = {
    ...normalizeListQuery(query),
  };

  if (query.fullName?.trim()) params.fullName = query.fullName.trim();
  if (query.GroupName?.trim()) params.GroupName = query.GroupName.trim();
  if (query.user) params.user = query.user;
  if (typeof query.isActive === "boolean") params.isActive = query.isActive;

  const response = await api.get("/users", { params });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function listUsersRoleSpecific(
  role: string | null,
  query: UserListQuery = {}
) {
  const normalizedRole = normalizeRole(role);
  const params: Record<string, unknown> = {};

  if (query.fullName?.trim()) params.fullName = query.fullName.trim();
  if (query.GroupName?.trim()) params.GroupName = query.GroupName.trim();
  if (query.user) params.user = query.user;
  if (typeof query.isActive === "boolean") params.isActive = query.isActive;
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;

  if (normalizedRole === "superadmin") {
    const response = await api.get("/users/superAdmin/getAllRoles", { params });
    return unwrapApiData<any[]>(response.data) ?? [];
  }

  if (normalizedRole === "admin") {
    const response = await api.get("/users/admin/getAll_Students_And_Techers", {
      params,
    });
    return unwrapApiData<any[]>(response.data) ?? [];
  }

  if (normalizedRole === "teacher" || normalizedRole === "mentor") {
    const response = await api.get("/users/teacher/getAll_Students", {
      params,
    });
    return unwrapApiData<any[]>(response.data) ?? [];
  }

  return [];
}

export async function listUsers(
  role: string | null,
  query: UserListQuery = {},
  strategy: RequestStrategy = "scoped"
) {
  if (strategy === "role-specific") {
    return listUsersRoleSpecific(role, query);
  }

  return listUsersScoped(query);
}

export async function getUserById(id: number) {
  const response = await api.get(`/users/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createTeacher(payload: UserCreatePayload) {
  const response = await api.post(
    "/users/create/teacher",
    createFormData(payload),
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return unwrapApiData<any>(response.data);
}

export async function createStudent(payload: UserCreatePayload) {
  const response = await api.post(
    "/users/create/student",
    createFormData(payload),
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return unwrapApiData<any>(response.data);
}

export async function createAdmin(payload: UserCreatePayload) {
  const response = await api.post(
    "/users/create/admin",
    createFormData(payload),
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return unwrapApiData<any>(response.data);
}

export async function updateUser(id: number, payload: UserUpdatePayload) {
  const response = await api.patch(`/users/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function removeUser(id: number) {
  const response = await api.delete(`/users/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function activateUser(id: number) {
  const response = await api.patch(`/users/active/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function getUsersProfile() {
  const response = await api.get("/users/profile");
  return unwrapApiData<any>(response.data);
}

export async function updateUsersProfile(payload: { fullName: string }) {
  const response = await api.patch("/users/profile", payload);
  return unwrapApiData<any>(response.data);
}

export async function getProfileMe() {
  const response = await api.get("/user-profiles/profile/me");
  return unwrapApiData<any>(response.data);
}

export async function updateProfileMe(payload: ProfileUpdatePayload) {
  const response = await api.put(
    "/user-profiles/profile/update",
    createFormData(payload),
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return unwrapApiData<any>(response.data);
}

export async function getCurrentProfile() {
  try {
    return await getProfileMe();
  } catch {
    return getUsersProfile();
  }
}

export async function updateCurrentProfile(payload: ProfileUpdatePayload) {
  const hasExtendedFields = [
    "phone",
    "email",
    "passwordHash",
    "dateOfBirth",
    "language",
    "avatarUrl",
  ].some(
    (key) =>
      key in payload && payload[key as keyof ProfileUpdatePayload] !== undefined
  );

  if (hasExtendedFields) {
    await updateProfileMe(payload);
    return getCurrentProfile();
  }

  if (payload.fullName) {
    return updateUsersProfile({ fullName: payload.fullName });
  }

  return getCurrentProfile();
}

export async function listCourses(query: CourseListQuery = {}) {
  const params: Record<string, unknown> = normalizeListQuery(query);
  if (query.level) params.level = query.level;

  const response = await api.get("/courses", { params });
  const payload = response.data;
  return {
    items: unwrapApiData<any[]>(payload) ?? [],
    meta: payload?.meta ?? null,
  };
}

export async function getCourseById(id: number) {
  const response = await api.get(`/courses/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createCourse(payload: CoursePayload) {
  const response = await api.post("/courses/create", createFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<any>(response.data);
}

export async function updateCourse(
  id: number,
  payload: Partial<CoursePayload>
) {
  const response = await api.patch(`/courses/${id}`, createFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<any>(response.data);
}

export async function deleteCourse(id: number) {
  const response = await api.delete(`/courses/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function listGroups(search?: string) {
  const response = await api.get("/groups", {
    params: search?.trim() ? { name: search.trim() } : undefined,
  });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getGroupById(id: number) {
  const response = await api.get(`/groups/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createGroup(payload: GroupPayload) {
  const response = await api.post("/groups", payload);
  return unwrapApiData<any>(response.data);
}

export async function updateGroup(id: number, payload: Partial<GroupPayload>) {
  const response = await api.patch(`/groups/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function deleteGroup(id: number) {
  const response = await api.delete(`/groups/${id}`);
  return unwrapApiData<any>(response.data);
}

// ── Group Members ────────────────────────────────────────────────────────────

/** GET /group-members/:groupId — guruh a'zolari ro'yxati */
export async function getGroupMembers(groupId: number) {
  const response = await api.get(`/group-members/${groupId}`);
  return (unwrapApiData<any[]>(response.data) ?? response.data) as any[];
}

/** POST /group-members/:groupId/add/:studentId — o'quvchini guruhga qo'shish */
export async function addGroupMember(groupId: number, studentId: number) {
  const response = await api.post(`/group-members/${groupId}/add/${studentId}`);
  return unwrapApiData<any>(response.data);
}

/** DELETE /group-members/:groupId/remove/:studentId — o'quvchini guruhdan chiqarish */
export async function removeGroupMember(groupId: number, studentId: number) {
  const response = await api.delete(
    `/group-members/${groupId}/remove/${studentId}`
  );
  return unwrapApiData<any>(response.data);
}

// ── Group Course ──────────────────────────────────────────────────────────────

export interface GroupCourseQuery {
  page?: number;
  limit?: number;
  groupId?: number;
  courseId?: number;
  isActive?: boolean;
}

/**
 * GET /group-course
 * Barcha group-course bog'lanishlarini olish (filter: groupId, courseId, page, limit)
 */
export async function listGroupCourses(query?: GroupCourseQuery) {
  const response = await api.get("/group-course", { params: query });
  // returns { data: [...], meta: { total, page, limit, totalPages } }
  const body = response.data;
  return {
    data: (body?.data ?? body) as any[],
    meta: body?.meta as
      | { total: number; page: number; limit: number; totalPages: number }
      | undefined,
  };
}

/**
 * GET /group-course/:id — bitta GroupCourse yozuvini olish
 */
export async function getGroupCourseById(id: number) {
  const response = await api.get(`/group-course/${id}`);
  return unwrapApiData<any>(response.data);
}

/**
 * POST /group-courses/:groupId/course/:courseId — guruhga kurs biriktirish (admin/superadmin)
 */
export async function assignCourseToGroup(groupId: number, courseId: number) {
  const response = await api.post(
    `/group-courses/${groupId}/course/${courseId}`
  );
  return unwrapApiData<any>(response.data);
}

/**
 * PATCH /group-course/:id — bog'lanishni yangilash (admin/superadmin)
 */
export async function updateGroupCourse(
  id: number,
  payload: { groupId?: number; courseId?: number; isActive?: boolean }
) {
  const response = await api.patch(`/group-course/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

/**
 * DELETE /group-courses/:id — soft delete by record id (admin/superadmin)
 */
export async function removeGroupCourse(id: number) {
  const response = await api.delete(`/group-courses/${id}`);
  return unwrapApiData<any>(response.data);
}

/**
 * GET /group-courses/by-course/:courseId — kursga biriktirilgan guruhlar ro'yxati
 */
export async function getGroupsByCourse(courseId: number) {
  const response = await api.get(`/group-courses/by-course/${courseId}`);
  return (unwrapApiData<any[]>(response.data) ?? []) as any[];
}

/**
 * GET /group-courses/:groupId — guruhga biriktirilgan kurslar ro'yxati
 */
export async function getCoursesByGroup(groupId: number) {
  const response = await api.get(`/group-courses/${groupId}`);
  return (unwrapApiData<any[]>(response.data) ?? []) as any[];
}

export type BookListQuery = ListQuery & {
  cefrLevel?: CefrLevel | "";
  author?: string;
  isActive?: boolean;
};

function normalizeBookListQuery(query: BookListQuery = {}) {
  const params: Record<string, unknown> = normalizeListQuery(query);
  if (query.cefrLevel) params.cefrLevel = query.cefrLevel;
  if (query.author?.trim()) params.author = query.author.trim();
  if (typeof query.isActive === "boolean")
    params.isActive = String(query.isActive);
  return params;
}

export async function listBooks(query: BookListQuery = {}) {
  const response = await api.get("/books", {
    params: normalizeBookListQuery(query),
  });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getBookById(id: number) {
  const response = await api.get(`/books/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createBook(payload: BookPayload) {
  const response = await api.post("/books", createFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<any>(response.data);
}

export async function updateBook(id: number, payload: Partial<BookPayload>) {
  const response = await api.patch(`/books/${id}`, createFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<any>(response.data);
}

export async function deleteBook(id: number) {
  const response = await api.delete(`/books/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function listTasks() {
  const response = await api.get("/tasks");
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getTaskById(id: number) {
  const response = await api.get(`/tasks/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createTask(payload: TaskPayload) {
  const response = await api.post("/tasks", payload);
  return unwrapApiData<any>(response.data);
}

export async function updateTask(id: number, payload: Partial<TaskPayload>) {
  const response = await api.patch(`/tasks/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function deleteTask(id: number) {
  const response = await api.delete(`/tasks/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function login(payload: { phone: string; password: string }) {
  const response = await api.post("/auth/login", payload);
  return unwrapApiData<any>(response.data);
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return unwrapApiData<any>(response.data);
}

export async function getGroupsByTeacherId(teacherId: number) {
  const response = await api.get(`/groups/${teacherId}/groups`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getGroupMembersViaGroup(groupId: number) {
  const response = await api.get(`/groups/get/${groupId}/members`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export type GroupAssignmentPayload = {
  groupId: number;
  studentId?: number | null;
  taskId?: number | null;
  testId?: number | null;
  dueDate?: string | null;
  isRequired?: boolean;
};

export async function createGroupAssignment(payload: GroupAssignmentPayload) {
  const response = await api.post("/group-assignments/create", payload);
  return unwrapApiData<any>(response.data);
}

export async function listGroupAssignments(groupName?: string) {
  const response = await api.get("/group-assignments/get-all", {
    params: groupName?.trim() ? { groupName: groupName.trim() } : undefined,
  });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getGroupAssignmentById(id: number) {
  const response = await api.get(`/group-assignments/get/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function updateGroupAssignment(
  id: number,
  payload: Partial<GroupAssignmentPayload>
) {
  const response = await api.patch(`/group-assignments/update/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function deleteGroupAssignment(id: number) {
  const response = await api.delete(`/group-assignments/delete/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createTaskAttachment(
  taskId: number,
  payload: Record<string, unknown>
) {
  const response = await api.post(`/task-attachments/task/${taskId}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function getTaskAttachments(taskId: number) {
  const response = await api.get(`/task-attachments/task/${taskId}`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function submitStudentTask(
  studentId: number,
  taskId: number,
  submissionUrl: string
) {
  const response = await api.post(
    `/student-tasks/submit/${studentId}/${taskId}`,
    { submissionUrl }
  );
  return unwrapApiData<any>(response.data);
}

export async function getStudentTasks(studentId: number) {
  const response = await api.get(`/student-tasks/student/${studentId}`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export type VocabularyPayload = {
  word: string;
  translation: string;
  exampleSentence?: string;
  difficulty?: number;
  courseId?: number | null;
};

export type VocabularyListQuery = ListQuery & {
  word?: string;
  courseId?: number | null;
  difficulty?: number | null;
};

export async function createVocabulary(payload: VocabularyPayload) {
  const response = await api.post("/vocabularies/create", payload);
  return unwrapApiData<any>(response.data);
}

export async function listVocabularies(query: VocabularyListQuery = {}) {
  const params: Record<string, unknown> = normalizeListQuery(query);
  if (query.word?.trim()) params.search = query.word.trim();
  if (query.courseId) params.courseId = query.courseId;
  if (query.difficulty) params.difficulty = query.difficulty;

  const response = await api.get("/vocabularies/get-all", { params });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getVocabularyById(id: number) {
  const response = await api.get(`/vocabularies/get/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function updateVocabulary(
  id: number,
  payload: Partial<VocabularyPayload>
) {
  const response = await api.patch(`/vocabularies/update/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function deleteVocabulary(id: number) {
  const response = await api.delete(`/vocabularies/delete/${id}`);
  return unwrapApiData<any>(response.data);
}

export type WordListPayload = {
  studentId?: number;
  title?: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
};

export async function createWordList(payload: WordListPayload) {
  const response = await api.post("/word-lists/create", payload);
  return unwrapApiData<any>(response.data);
}

export async function listWordLists() {
  const response = await api.get("/word-lists/get-all");
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getWordListById(id: number) {
  const response = await api.get(`/word-lists/get/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function updateWordList(
  id: number,
  payload: Partial<WordListPayload>
) {
  const response = await api.patch(`/word-lists/update/${id}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function deleteWordList(id: number) {
  const response = await api.delete(`/word-lists/delete/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function addWordListItem(
  wordListId: number,
  payload: { vocabularyId: number }
) {
  const response = await api.post(
    `/word-list-items/${wordListId}/add`,
    payload
  );
  return unwrapApiData<any>(response.data);
}

export async function listWordListItems(wordListId: number) {
  const response = await api.get(`/word-list-items/${wordListId}/all`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function removeWordListItem(
  wordListId: number,
  vocabularyId: number
) {
  const response = await api.delete(
    `/word-list-items/${wordListId}/remove/${vocabularyId}`
  );
  return unwrapApiData<any>(response.data);
}

export async function submitVocabularyReview(payload: {
  vocabularyId: number;
  quality: number;
}) {
  const response = await api.post(
    "/vocabulary-progress/submit-review",
    payload
  );
  return unwrapApiData<any>(response.data);
}

export async function getDueVocabularyReviews() {
  const response = await api.get("/vocabulary-progress/due-reviews");
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getVocabularyProgressByStudent(studentId: number) {
  const response = await api.get(`/vocabulary-progress/student/${studentId}`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getVocabularyProgressById(id: number) {
  const response = await api.get(`/vocabulary-progress/get/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createRating(payload: {
  userId: number;
  targetType: string;
  targetId: string | number;
  score: number;
  reviewText?: string;
}) {
  const response = await api.post("/ratings", payload);
  return unwrapApiData<any>(response.data);
}

export async function listRatings() {
  const response = await api.get("/ratings");
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getRatingsByTarget(
  targetType: string,
  targetId: string | number
) {
  const response = await api.get("/ratings/target", {
    params: { type: targetType, id: targetId },
  });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function deleteRating(id: number) {
  const response = await api.delete(`/ratings/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function listAchievements() {
  const response = await api.get("/achievements");
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getStudentAchievements(studentId: number) {
  const response = await api.get(`/achievements/student/${studentId}`);
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function getLeaderboard(limit?: number) {
  const response = await api.get("/leaderboard", {
    params: limit ? { limit } : undefined,
  });
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function addXp(
  userId: number,
  payload: { amount: number; reason?: string; referenceId?: string | number }
) {
  const response = await api.post(`/xp/add/${userId}`, payload);
  return unwrapApiData<any>(response.data);
}

export async function getXpRank(userId: number) {
  const response = await api.get(`/xp/rank/${userId}`);
  return unwrapApiData<any>(response.data);
}

export async function getPublicCenterSettings() {
  const response = await api.get("/center-settings/public");
  return unwrapApiData<any>(response.data);
}

export async function getCenterSettings() {
  const response = await api.get("/center-settings");
  return unwrapApiData<any>(response.data);
}

export async function updateCenterSettings(payload: Record<string, unknown>) {
  const response = await api.patch("/center-settings", payload);
  return unwrapApiData<any>(response.data);
}

function normalizeTestListQuery(query: TestListQuery = {}) {
  const params: Record<string, unknown> = normalizeListQuery(query);

  if (query.courseId) params.courseId = query.courseId;
  if (query.cefrLevel) params.cefrLevel = query.cefrLevel;
  if (query.type?.trim()) params.type = query.type.trim();
  if (typeof query.isPublished === 'boolean') params.isPublished = String(query.isPublished);
  if (typeof query.isActive === 'boolean') params.isActive = String(query.isActive);
  if (typeof query.isPublicExam === 'boolean') params.isPublicExam = String(query.isPublicExam);
  if (query.publicExamType) params.publicExamType = query.publicExamType;
  if (query.publicExamDirection) params.publicExamDirection = query.publicExamDirection;

  return params;
}

function normalizeTestPayload(payload: Partial<TestPayload>) {
  const normalized: Record<string, unknown> = {
    ...payload,
  };

  const timeLimitMinutes = payload.timeLimitMinutes ?? payload.duration;
  if (timeLimitMinutes !== undefined) {
    normalized.timeLimitMinutes = Number(timeLimitMinutes);
    normalized.duration = Number(timeLimitMinutes);
  }

  if (payload.cefrLevel === "") {
    delete normalized.cefrLevel;
  }

  if (
    payload.courseId === undefined ||
    payload.courseId === null ||
    Number(payload.courseId) <= 0
  ) {
    normalized.courseId = null;
  }

  if (
    payload.maxAttempts === undefined ||
    payload.maxAttempts === null ||
    Number(payload.maxAttempts) <= 0
  ) {
    normalized.maxAttempts = null;
  }

  if (payload.publicExamType === '') {
    normalized.publicExamType = null;
  }

  if (payload.publicExamDirection === '') {
    normalized.publicExamDirection = null;
  }

  if (payload.isPublicExam === false) {
    normalized.publicExamType = null;
    normalized.publicExamDirection = null;
  }

  return normalized;
}

function isEmptyValue(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getDefaultOptionLabel(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < alphabet.length) return alphabet[index];
  const digit = String((index - alphabet.length + 1) % 10);
  return digit || "0";
}

function normalizeOptionLabel(value: unknown, index: number) {
  const label = String(value ?? "").trim();
  return (label || getDefaultOptionLabel(index)).slice(0, 1).toUpperCase();
}

function parseStringOption(
  value: string,
  index: number
): QuestionOption | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = trimmed.match(/^([A-Za-z0-9])\s*[\).:-]\s*(.+)$/);
  if (parsed) {
    return {
      label: parsed[1].toUpperCase(),
      value: parsed[2].trim(),
    };
  }

  return {
    label: getDefaultOptionLabel(index),
    value: trimmed,
  };
}

function normalizeQuestionOptionRecord(
  option: Record<string, unknown>,
  index: number
): QuestionOption | null {
  const label = normalizeOptionLabel(
    option.label ?? option.key ?? option.name ?? option.option ?? option.id,
    index
  );
  const rawValue =
    option.value ??
    option.text ??
    option.answer ??
    option.title ??
    option.content;
  const value = String(rawValue ?? "").trim();

  if (!label && !value) return null;

  return {
    label,
    value,
  };
}

export function formatQuestionOption(option: QuestionOption) {
  return `${option.label}) ${option.value}`;
}

export function normalizeQuestionOptionItems(
  options: unknown
): QuestionOption[] {
  const decodedOptions =
    typeof options === "string"
      ? (() => {
        try {
          return JSON.parse(options);
        } catch {
          return options;
        }
      })()
      : options;

  if (Array.isArray(decodedOptions)) {
    return decodedOptions
      .map((item, index) => {
        if (typeof item === "string") return parseStringOption(item, index);
        if (item && typeof item === "object") {
          return normalizeQuestionOptionRecord(
            item as Record<string, unknown>,
            index
          );
        }
        return parseStringOption(String(item ?? ""), index);
      })
      .filter((item): item is QuestionOption => Boolean(item));
  }

  if (typeof decodedOptions === "string") {
    return decodedOptions
      .split(/\r?\n|,/)
      .map((item, index) => parseStringOption(item, index))
      .filter((item): item is QuestionOption => Boolean(item));
  }

  if (decodedOptions && typeof decodedOptions === "object") {
    const record = decodedOptions as Record<string, unknown>;
    if ("label" in record || "value" in record) {
      const option = normalizeQuestionOptionRecord(record, 0);
      return option ? [option] : [];
    }

    return Object.entries(record)
      .map(([label, value], index) => ({
        label: normalizeOptionLabel(label, index),
        value: String(value ?? "").trim(),
      }))
      .filter((item) => item.value.length > 0);
  }

  return [];
}

export function validateQuestionPayload(
  question: Partial<TestQuestionPayload>,
  index = 0
) {
  const errors: string[] = [];
  const label = `${index + 1}-savol`;
  const options = normalizeQuestionOptionItems(question.options);
  const inputType = String(
    question.inputType || question.type || ""
  ).toUpperCase();
  const requiresOptions =
    inputType.includes("OPTION") || inputType.includes("MCQ");

  if (!question.questionText?.trim()) {
    errors.push(`${label}: savol matni kiritilishi kerak`);
  }

  if (requiresOptions && options.length < 2) {
    errors.push(`${label}: kamida 2 ta javob varianti kerak`);
  }

  if (requiresOptions) {
    const optionLabels = new Set<string>();
    options.forEach((option, optionIndex) => {
      if (option.label.length !== 1) {
        errors.push(
          `${label}: ${optionIndex + 1
          }-variant nomi faqat 1 ta belgidan iborat bo'lishi kerak`
        );
      }
      if (!option.value.trim()) {
        errors.push(
          `${label}: ${option.label || optionIndex + 1
          }-variant qiymati kiritilishi kerak`
        );
      }
      const normalizedLabel = option.label.toUpperCase();
      if (optionLabels.has(normalizedLabel)) {
        errors.push(`${label}: variant nomlari takrorlanmasligi kerak`);
      }
      optionLabels.add(normalizedLabel);
    });
  }

  if (isEmptyValue(question.correctAnswer)) {
    errors.push(`${label}: to'g'ri javob kiritilishi kerak`);
  } else if (requiresOptions && options.length > 0) {
    const correctAnswer = String(question.correctAnswer).trim().toUpperCase();
    if (
      !options.some((option) => option.label.toUpperCase() === correctAnswer)
    ) {
      errors.push(
        `${label}: to'g'ri javob variant nomlaridan biri bo'lishi kerak`
      );
    }
  }

  if (question.points !== undefined && Number(question.points) < 1) {
    errors.push(`${label}: ball 1 dan kam bo'lmasligi kerak`);
  }

  if (question.difficulty !== undefined && Number(question.difficulty) < 1) {
    errors.push(`${label}: qiyinlik darajasi 1 dan kam bo'lmasligi kerak`);
  }

  return errors;
}

export function validateTestPayload(payload: Partial<TestPayload>) {
  const errors: string[] = [];
  const timeLimitMinutes = Number(
    payload.timeLimitMinutes ?? payload.duration ?? 0
  );

  if (!payload.title?.trim()) {
    errors.push("Test nomi kiritilishi kerak");
  }

  if (!Number.isFinite(timeLimitMinutes) || timeLimitMinutes < 1) {
    errors.push("Test davomiyligi kamida 1 daqiqa bo'lishi kerak");
  }

  if (
    !Number.isFinite(Number(payload.passingScore)) ||
    Number(payload.passingScore) < 0 ||
    Number(payload.passingScore) > 100
  ) {
    errors.push("O'tish foizi 0 dan 100 gacha bo'lishi kerak");
  }

  if (
    payload.maxAttempts !== undefined &&
    payload.maxAttempts !== null &&
    Number(payload.maxAttempts) < 1
  ) {
    errors.push("Urinishlar soni 1 dan kam bo'lmasligi kerak");
  }

  if (payload.isPublicExam) {
    const mode = String(payload.publicExamType || '').toUpperCase();
    if (!mode) {
      errors.push('Public exam uchun mode tanlanishi kerak (LEVEL yoki TRACK)');
    } else if (mode !== 'LEVEL' && mode !== 'TRACK') {
      errors.push('Public exam mode faqat LEVEL yoki TRACK bo‘lishi kerak');
    }

    if (mode === 'LEVEL' && !payload.cefrLevel) {
      errors.push('LEVEL public exam uchun CEFR level tanlanishi kerak');
    }

    if (mode === 'TRACK' && !payload.publicExamDirection) {
      errors.push('TRACK public exam uchun yo‘nalish tanlanishi kerak');
    }
  }

  payload.questions?.forEach((question, index) => {
    errors.push(...validateQuestionPayload(question, index));
  });

  return errors;
}

export function validateAttemptAnswers(
  test: TestItem,
  answers: Record<string, unknown>
) {
  const errors: string[] = [];
  const questions =
    test.questions?.filter((question) => question.isActive !== false) ?? [];

  questions.forEach((question, index) => {
    const value = answers[String(question.id)];
    const label = `${index + 1}-savol`;

    if (isEmptyValue(value)) {
      errors.push(`${label}: javob tanlanmagan`);
      return;
    }

    const options = normalizeQuestionOptionItems(question.options);
    if (
      options.length > 0 &&
      !options.some(
        (option) => option.label === String(value).trim().toUpperCase()
      )
    ) {
      errors.push(`${label}: javob mavjud variantlardan tanlanishi kerak`);
    }
  });

  return errors;
}

export function normalizeQuestionOptions(options: unknown): string[] {
  return normalizeQuestionOptionItems(options).map(formatQuestionOption);
}

export async function listTests(query: TestListQuery = {}) {
  const response = await api.get("/tests", {
    params: normalizeTestListQuery(query),
  });
  const payload = response.data;
  return {
    items: unwrapApiData<TestItem[]>(payload) ?? [],
    meta: payload?.meta ?? null,
  };
}

export async function getTestById(id: number) {
  const response = await api.get(`/tests/${id}`);
  return unwrapApiData<TestItem>(response.data);
}

export async function createTest(payload: TestPayload) {
  const errors = validateTestPayload(payload);
  if (errors.length) throw new Error(errors.join("\n"));

  const response = await api.post("/tests", normalizeTestPayload(payload));
  return unwrapApiData<TestItem>(response.data);
}

export async function updateTest(id: number, payload: Partial<TestPayload>) {
  const errors = validateTestPayload({
    title: payload.title || "existing",
    duration: payload.duration ?? payload.timeLimitMinutes ?? 1,
    passingScore: payload.passingScore ?? 0,
    questions: payload.questions,
    maxAttempts: payload.maxAttempts,
  });
  if (errors.length) throw new Error(errors.join("\n"));

  const response = await api.patch(
    `/tests/${id}`,
    normalizeTestPayload(payload)
  );
  return unwrapApiData<TestItem>(response.data);
}

export async function deleteTest(id: number) {
  const response = await api.delete(`/tests/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function createQuestion(
  testId: number,
  payload: TestQuestionPayload
) {
  const errors = validateQuestionPayload(payload);
  if (errors.length) throw new Error(errors.join("\n"));

  const response = await api.post(`/questions/test/${testId}`, payload);
  return unwrapApiData<TestQuestion>(response.data);
}

export async function getQuestionsByTest(testId: number) {
  const response = await api.get(`/questions/test/${testId}`);
  return unwrapApiData<TestQuestion[]>(response.data) ?? [];
}

export async function updateQuestion(
  id: number,
  payload: Partial<TestQuestionPayload>
) {
  const errors = validateQuestionPayload({
    questionText: payload.questionText || "existing",
    correctAnswer: payload.correctAnswer ?? "existing",
    ...payload,
  });
  if (errors.length) throw new Error(errors.join("\n"));

  const response = await api.patch(`/questions/${id}`, payload);
  return unwrapApiData<TestQuestion>(response.data);
}

export async function deleteQuestion(id: number) {
  const response = await api.delete(`/questions/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function startTestAttempt(testId: number) {
  const response = await api.post(`/tests/${testId}/start`);
  return response.data as {
    status?: number;
    success?: boolean;
    message?: string;
    data: TestAttempt;
    test: TestItem;
  };
}

export async function submitTestAttempt(
  testId: number,
  payload: TestAttemptSubmitPayload,
  test?: TestItem
) {
  if (test && payload.answers && !Array.isArray(payload.answers)) {
    const errors = validateAttemptAnswers(test, payload.answers);
    if (errors.length) throw new Error(errors.join("\n"));
  }

  const response = await api.post(`/tests/${testId}/submit`, {
    ...payload,
    testId,
  });
  return unwrapApiData<TestAttempt>(response.data);
}

export async function submitTestAttemptRecord(
  payload: TestAttemptSubmitPayload
) {
  const response = await api.post("/test-attempts/submit", payload);
  return unwrapApiData<TestAttempt>(response.data);
}

export async function getMyTestAttempts() {
  const response = await api.get("/tests/my-attempts");
  return unwrapApiData<TestAttempt[]>(response.data) ?? [];
}

export async function getStudentTestAttempts(studentId: number) {
  const response = await api.get(`/test-attempts/student/${studentId}`);
  return unwrapApiData<TestAttempt[]>(response.data) ?? [];
}

export async function listPublicExams(query: {
  mode?: PublicExamMode;
  level?: CefrLevel | '';
  direction?: PublicExamDirection | '';
  search?: string;
  limit?: number;
} = {}) {
  const params: Record<string, unknown> = {};
  if (query.mode) params.mode = query.mode;
  if (query.level) params.level = query.level;
  if (query.direction) params.direction = query.direction;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.limit) params.limit = query.limit;

  const response = await api.get('/public-exams/catalog', { params });
  return response.data as PublicExamCatalogResponse;
}

export async function getPublicExamById(id: number) {
  const response = await api.get(`/public-exams/${id}`);
  return unwrapApiData<TestItem>(response.data);
}

export async function submitPublicExam(testId: number, payload: PublicExamSubmitPayload) {
  const response = await api.post(`/public-exams/${testId}/submit`, payload);
  return unwrapApiData<PublicExamResult>(response.data);
}

export async function getPublicExamRatings(query: {
  mode?: PublicExamMode;
  level?: CefrLevel | '';
  direction?: PublicExamDirection | '';
  testId?: number;
  limit?: number;
} = {}) {
  const params: Record<string, unknown> = {};
  if (query.mode) params.mode = query.mode;
  if (query.level) params.level = query.level;
  if (query.direction) params.direction = query.direction;
  if (query.testId) params.testId = query.testId;
  if (query.limit) params.limit = query.limit;

  const response = await api.get('/public-exams/ratings', { params });
  const payload = response.data;
  return {
    items: unwrapApiData<PublicExamRatingItem[]>(payload) ?? [],
    meta: payload?.meta ?? null,
  };
}

export async function createLead(payload: LeadPayload) {
  const response = await api.post("/leads", payload);
  return unwrapApiData<any>(response.data);
}

export async function listLeads() {
  const response = await api.get("/leads");
  return unwrapApiData<LeadItem[]>(response.data) ?? [];
}

export async function updateLeadStatus(id: number, status: LeadStatus) {
  const response = await api.patch(`/leads/${id}/status`, { status });
  return unwrapApiData<any>(response.data);
}

export async function answerLeadQuestion(
  id: number,
  payload: LeadAnswerPayload
) {
  const response = await api.patch(`/leads/${id}/answer`, payload);
  return unwrapApiData<LeadItem>(response.data);
}

export async function listPublishedLeadQuestions() {
  const response = await api.get("/leads/public/questions");
  return unwrapApiData<PublicLeadQuestion[]>(response.data) ?? [];
}

export async function deleteLead(id: number) {
  const response = await api.delete(`/leads/${id}`);
  return unwrapApiData<any>(response.data);
}

export async function getMyNotifications() {
  const response = await api.get("/notifications/me");
  return unwrapApiData<NotificationFeed>(response.data);
}

export async function markNotificationAsRead(id: number) {
  const response = await api.patch(`/notifications/${id}/read`);
  return unwrapApiData<any>(response.data);
}

export async function markAllNotificationsAsRead() {
  const response = await api.patch("/notifications/read-all");
  return unwrapApiData<NotificationFeed>(response.data);
}

export async function removeNotification(id: number) {
  const response = await api.delete(`/notifications/${id}`);
  return unwrapApiData<any>(response.data);
}

// ── Telegram Bot Management ──────────────────────────────────────────────────

export type BotStats = {
  usersCount: number;
  leadsCount: number;
  coursesCount: number;
  resultsCount: number;
};

export type BotCenterInfo = {
  id?: number;
  phone: string;
  address: string;
  schedule: string;
  isActive?: boolean;
};

export type BotCourse = {
  id: number;
  title: string;
  level: string;
  description?: string;
  isActive: boolean;
};

export type BotLead = {
  id: number;
  fullName: string;
  phone: string;
  message?: string;
  createdAt: string;
};

export async function getBotStats() {
  const response = await api.get('/bot/admin/stats');
  return unwrapApiData<BotStats>(response.data);
}

export async function getBotAdmins() {
  const response = await api.get('/bot/admin/users');
  return unwrapApiData<any[]>(response.data) ?? [];
}

export async function createBotAdmin(payload: { phone: string; fullName: string }) {
  const response = await api.post('/bot/admin/users', payload);
  return unwrapApiData<any>(response.data);
}

export async function getBotLeads(limit = 10) {
  const response = await api.get('/bot/leads', { params: { limit } });
  return unwrapApiData<BotLead[]>(response.data) ?? [];
}

export async function getBotCenterInfo() {
  const response = await api.get('/bot/center-info');
  return unwrapApiData<BotCenterInfo>(response.data);
}

export async function updateBotCenterInfo(payload: BotCenterInfo) {
  const response = await api.put('/bot/center-info', payload);
  return unwrapApiData<BotCenterInfo>(response.data);
}

export async function getBotCourses() {
  const response = await api.get('/bot/courses');
  return unwrapApiData<BotCourse[]>(response.data) ?? [];
}

export async function createBotCourse(payload: Omit<BotCourse, 'id' | 'isActive'>) {
  const response = await api.post('/bot/courses', payload);
  return unwrapApiData<BotCourse>(response.data);
}

export async function updateBotCourse(id: number, payload: Partial<BotCourse>) {
  const response = await api.patch(`/bot/courses/${id}`, payload);
  return unwrapApiData<BotCourse>(response.data);
}

// ── Question Analytics ────────────────────────────────────────────────────────

export type QuestionAnalyticsItem = {
  questionId: number;
  testId: number;
  questionText: string;
  type: string;
  inputType: string;
  points: number;
  difficulty: number;
  skill?: string | null;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercent: number;
  avgTimeSeconds: number;
};

export async function getQuestionAnalytics(testId?: number) {
  const params: Record<string, unknown> = {};
  if (testId) params.testId = testId;
  const response = await api.get('/questions/analytics', { params });
  return unwrapApiData<QuestionAnalyticsItem[]>(response.data) ?? [];
}

export async function getQuestionAnalyticsById(questionId: number) {
  const response = await api.get(`/questions/analytics/${questionId}`);
  return unwrapApiData<QuestionAnalyticsItem>(response.data);
}
