import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/// Authenticated BFF proxy for owner/staff dashboard calls.
///
/// The owner's JWT lives in an httpOnly `access_token` cookie on the *web*
/// origin, so the browser can't attach it to cross-origin calls against the
/// Nest API. This route reads that cookie server-side and forwards the request
/// to the API with an `Authorization: Bearer` header, keeping the token out of
/// client-readable JS. All owner dashboard polling/actions go through here.
///
/// Path mapping: `/api/owner/<rest>` → `<NEXT_PUBLIC_API_URL>/<rest>`.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function forward(req: NextRequest, pathParts: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 },
    );
  }

  const path = pathParts.map(encodeURIComponent).join('/');
  const search = req.nextUrl.search;
  const url = `${API_BASE.replace(/\/+$/u, '')}/${path}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const text = await req.text();
    if (text) {
      body = text;
      headers['Content-Type'] =
        req.headers.get('content-type') || 'application/json';
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: `Failed to reach API at ${API_BASE}` },
      { status: 502 },
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  }

  const raw = await res.text().catch(() => '');
  return new NextResponse(raw, {
    status: res.status,
    headers: { 'Content-Type': contentType || 'text/plain' },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
