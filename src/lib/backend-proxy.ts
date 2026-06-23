import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_API_URL, getBackendProxyBaseUrl } from '@/lib/api-url';

export type BackendProxyRouteContext = {
  params: Promise<{ path: string[] }>;
};

const LEGACY_PROXY_PREFIX = 'proxy';

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'expect',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'cookie',
  'range',
  'user-agent',
] as const;

function resolveBackendBaseUrl(request: NextRequest) {
  const directApiBaseUrl = getBackendProxyBaseUrl(request.nextUrl.origin);

  try {
    return new URL(directApiBaseUrl).toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_API_URL;
  }
}

function normalizeProxyPath(path: string[]) {
  if (path[0] === LEGACY_PROXY_PREFIX) {
    return path.slice(1);
  }

  return path;
}

function buildTargetUrl(baseUrl: string, path: string[], request: NextRequest) {
  const targetUrl = new URL(baseUrl);
  const basePath = targetUrl.pathname.replace(/\/+$/, '');
  const targetPath = path
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  targetUrl.pathname = targetPath ? `${basePath}/${targetPath}` : basePath || '/';
  targetUrl.search = request.nextUrl.search;

  return targetUrl;
}

export async function proxyBackendRequest(request: NextRequest, context: BackendProxyRouteContext) {
  const { path } = await context.params;
  const targetPath = normalizeProxyPath(Array.isArray(path) ? path : []);
  const targetUrl = buildTargetUrl(resolveBackendBaseUrl(request), targetPath, request);

  const headers = new Headers();
  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = Buffer.from(await request.arrayBuffer());
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);

    for (const headerName of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(headerName);
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Backend proxy request failed',
        detail: error instanceof Error ? error.message : 'Unknown proxy error',
      },
      { status: 502 },
    );
  }
}
