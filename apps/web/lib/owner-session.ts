import 'server-only';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/// One business the signed-in owner/staff has a membership in.
export interface OwnerBusiness {
  id: string;
  slug: string;
  name: string;
  membershipRole: string;
}

export interface OwnerProfile {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  businesses: OwnerBusiness[];
}

interface MeResponse {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  memberships: Array<{
    id: string;
    role: string;
    business: { id: string; slug: string; name: string } | null;
  }>;
}

/// Reads the owner's profile server-side using the httpOnly access-token
/// cookie. Returns null when unauthenticated or the API is unreachable so
/// callers can fall back / redirect. Never throws.
export async function getOwnerProfile(): Promise<OwnerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const raw = (await res.json()) as { data?: MeResponse } | MeResponse;
    const me = 'data' in raw && raw.data ? raw.data : (raw as MeResponse);
    if (!me?.id) return null;

    const businesses: OwnerBusiness[] = (me.memberships ?? [])
      .filter((m) => m.business)
      .map((m) => ({
        id: m.business!.id,
        slug: m.business!.slug,
        name: m.business!.name,
        membershipRole: m.role,
      }));

    return {
      id: me.id,
      tenantId: me.tenantId,
      email: me.email,
      name: me.name,
      role: me.role,
      businesses,
    };
  } catch {
    return null;
  }
}

/// Convenience: the owner's primary (first) business, or null.
export async function getPrimaryBusiness(): Promise<OwnerBusiness | null> {
  const profile = await getOwnerProfile();
  return profile?.businesses[0] ?? null;
}
