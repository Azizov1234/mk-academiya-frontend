import { Preferences } from '@capacitor/preferences';
import { AppApiError } from '@/lib/offline/errors';

const CACHE_PREFIX = 'mk-academy:api-cache:v1:';

export interface CachedGetPayload<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cachedAt: string;
}

interface CacheRecord<T = unknown> {
  version: 1;
  value: CachedGetPayload<T>;
}

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`).join(',')}}`;
}

export function buildGetCacheKey(input: { url: string; params?: unknown; scope?: string }): string {
  const scope = input.scope || 'public';
  const params = stableSerialize(input.params);
  return `${CACHE_PREFIX}${scope}:${input.url}:${params}`;
}

export async function setCachedGetResponse<T>(
  key: string,
  payload: Omit<CachedGetPayload<T>, 'cachedAt'>,
): Promise<void> {
  try {
    const record: CacheRecord<T> = {
      version: 1,
      value: {
        ...payload,
        cachedAt: new Date().toISOString(),
      },
    };

    await Preferences.set({
      key,
      value: JSON.stringify(record),
    });
  } catch (error) {
    throw new AppApiError({
      code: 'CACHE_PARSE',
      message: "Cache ma'lumotini saqlashda xatolik yuz berdi",
      cause: error,
    });
  }
}

export async function getCachedGetResponse<T>(key: string): Promise<CachedGetPayload<T> | null> {
  const { value } = await Preferences.get({ key });
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as CacheRecord<T>;
    if (!parsed?.value) return null;
    return parsed.value;
  } catch (error) {
    await Preferences.remove({ key });
    throw new AppApiError({
      code: 'CACHE_PARSE',
      message: "Cache ma'lumotini o'qishda xatolik yuz berdi",
      cause: error,
    });
  }
}

export function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers) return {};

  if (typeof headers === 'object' && headers !== null && 'toJSON' in headers) {
    const json = (headers as { toJSON: () => unknown }).toJSON();
    if (json && typeof json === 'object') {
      return Object.fromEntries(
        Object.entries(json as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
      );
    }
  }

  if (typeof headers === 'object') {
    return Object.fromEntries(
      Object.entries(headers as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
    );
  }

  return {};
}

