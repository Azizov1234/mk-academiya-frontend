import axios from 'axios';
import api from '@/lib/api';

export interface CurrentUserProfile {
  id: number | null;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  cefrLevel: string | null;
  language: string;
  timezone: string;
  dateOfBirth: string | null;
}

function isRouteMissingError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const message =
    typeof error.response?.data?.message === 'string'
      ? error.response.data.message
      : Array.isArray(error.response?.data?.message)
        ? error.response?.data?.message.join(' ')
        : '';

  return (
    error.response?.status === 404 ||
    (error.response?.status === 400 && message.toLowerCase().includes('numeric string'))
  );
}

function normalizeCurrentUserProfile(raw: any): CurrentUserProfile {
  const nestedProfile = raw?.profile ?? raw?.user ?? {};
  const user = raw?.user ?? raw ?? {};

  return {
    id: user?.id ?? raw?.id ?? null,
    fullName: user?.fullName ?? raw?.fullName ?? '',
    email: raw?.email ?? nestedProfile?.email ?? '',
    phone: raw?.phone ?? user?.phone ?? nestedProfile?.phone ?? '',
    avatarUrl: user?.avatarUrl ?? raw?.avatarUrl ?? null,
    cefrLevel: user?.cefrLevel ?? raw?.cefrLevel ?? null,
    language: raw?.profile?.language ?? raw?.language ?? nestedProfile?.language ?? 'UZ',
    timezone: raw?.profile?.timezone ?? raw?.timezone ?? nestedProfile?.timezone ?? 'Asia/Tashkent',
    dateOfBirth:
      raw?.profile?.dateOfBirth ?? raw?.dateOfBirth ?? nestedProfile?.dateOfBirth ?? null,
  };
}

export async function fetchCurrentUserProfile(): Promise<CurrentUserProfile> {
  try {
    const response = await api.get('/user-profiles/profile/me');
    return normalizeCurrentUserProfile(response.data?.data ?? response.data);
  } catch (error) {
    if (!isRouteMissingError(error)) {
      throw error;
    }

    const response = await api.get('/users/profile');
    return normalizeCurrentUserProfile(response.data?.data ?? response.data);
  }
}

export async function updateCurrentUserProfile(payload: {
  fullName: string;
}): Promise<CurrentUserProfile> {
  try {
    const response = await api.patch('/users/profile', payload);
    return normalizeCurrentUserProfile(response.data?.data ?? response.data);
  } catch (error) {
    if (!isRouteMissingError(error) && !axios.isAxiosError(error)) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.response?.status && error.response.status !== 404 && error.response.status !== 400 && error.response.status !== 405) {
      throw error;
    }

    const response = await api.put('/user-profiles/profile/update', payload);
    return normalizeCurrentUserProfile(response.data?.data ?? response.data);
  }
}

export async function fetchUsersCompat(role: string | null, searchTerm: string) {
  const trimmedSearch = searchTerm.trim();
  const params = trimmedSearch ? { fullName: trimmedSearch } : undefined;

  try {
    const response = await api.get('/users', { params });
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    if (!isRouteMissingError(error)) {
      throw error;
    }

    if (role === 'superadmin') {
      const response = await api.get('/users/superAdmin/getAllRoles', { params });
      return response.data?.data ?? response.data ?? [];
    }

    if (role === 'admin') {
      const response = await api.get('/users/admin/getAll_Students_And_Techers', { params });
      return response.data?.data ?? response.data ?? [];
    }

    if (role === 'teacher') {
      const response = await api.get('/users/teacher/getAll_Students', { params });
      return response.data?.data ?? response.data ?? [];
    }

    throw error;
  }
}
