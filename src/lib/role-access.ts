export type AppRole = 'superadmin' | 'admin' | 'teacher' | 'mentor' | 'student' | 'global_user';
export type RoleCapability =
  | 'view_users'
  | 'manage_users'
  | 'create_admin'
  | 'create_teacher'
  | 'create_student'
  | 'view_system'
  | 'view_leads'
  | 'manage_leads'
  | 'manage_courses'
  | 'manage_groups'
  | 'manage_books'
  | 'manage_tasks'
  | 'manage_tests'
  | 'manage_gamification';

const ROLE_HOME_PATHS: Record<string, string> = {
  superadmin: '/dashboard',
  admin: '/dashboard',
  teacher: '/dashboard',
  mentor: '/dashboard',
  student: '/dashboard',
  global_user: '/public-exam',
};

const RESTRICTED_PREFIXES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/system', roles: ['superadmin'] },
  { prefix: '/users', roles: ['superadmin', 'admin', 'teacher', 'mentor'] },
  { prefix: '/leads', roles: ['superadmin', 'admin'] },
  { prefix: '/tasks', roles: ['superadmin', 'admin', 'teacher', 'mentor'] },
  { prefix: '/assignments', roles: ['superadmin', 'admin', 'teacher', 'mentor'] },
  { prefix: '/vocabulary-admin', roles: ['superadmin', 'admin', 'teacher', 'mentor'] },
  { prefix: '/gamification', roles: ['superadmin', 'admin', 'teacher', 'mentor', 'student'] },
];

const ROLE_CAPABILITIES: Record<AppRole, RoleCapability[]> = {
  superadmin: [
    'view_users',
    'manage_users',
    'create_admin',
    'create_teacher',
    'create_student',
    'view_system',
    'view_leads',
    'manage_leads',
    'manage_courses',
    'manage_groups',
    'manage_books',
    'manage_tasks',
    'manage_tests',
    'manage_gamification',
  ],
  admin: [
    'view_users',
    'manage_users',
    'create_teacher',
    'create_student',
    'view_leads',
    'manage_leads',
    'manage_courses',
    'manage_groups',
    'manage_books',
    'manage_tasks',
    'manage_tests',
    'manage_gamification',
  ],
  teacher: ['view_users', 'manage_books', 'manage_tasks', 'manage_tests'],
  mentor: ['view_users', 'manage_tasks', 'manage_tests'],
  student: [],
  global_user: [],
};

function normalizeRole(role: string | null | undefined) {
  const normalized = role?.toLowerCase();

  if (
    normalized === 'superadmin' ||
    normalized === 'admin' ||
    normalized === 'teacher' ||
    normalized === 'mentor' ||
    normalized === 'global_user'
  ) {
    return normalized;
  }

  return 'student';
}

export function isRoleAllowedForPath(pathname: string, role: string | null | undefined) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'global_user') {
    return (
      pathname === '/public-exam' ||
      pathname.startsWith('/public-exam/') ||
      pathname === '/public-rating' ||
      pathname.startsWith('/public-rating/')
    );
  }

  for (const rule of RESTRICTED_PREFIXES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.roles.includes(normalizedRole);
    }
  }

  return true;
}

export function getRoleHomePath(role: string | null | undefined) {
  const normalizedRole = normalizeRole(role);
  return ROLE_HOME_PATHS[normalizedRole] || '/';
}

export function hasRoleCapability(
  role: string | null | undefined,
  capability: RoleCapability,
) {
  const normalizedRole = normalizeRole(role) as AppRole;
  return ROLE_CAPABILITIES[normalizedRole].includes(capability);
}
