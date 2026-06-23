import { NextRequest } from 'next/server';
import { type BackendProxyRouteContext, proxyBackendRequest } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}

export async function POST(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}

export async function PUT(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}

export async function PATCH(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}

export async function DELETE(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: BackendProxyRouteContext) {
  return proxyBackendRequest(request, context);
}
