import 'server-only';
import { cookies } from 'next/headers';
import type { LiveQueue } from '@takda/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/// Server-side owner queue reads for SSR initial paint. These run in the
/// dashboard Server Component using the httpOnly access-token cookie; the
/// client `LiveQueueView` takes over polling after hydration. All return
/// null / [] on failure so the page still renders and the client retries.

async function ownerGet<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE.replace(/\/+$/u, '')}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as { data?: T } | T;
    return (raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data?: T }).data ?? null
      : (raw as T)) as T;
  } catch {
    return null;
  }
}

export interface OwnerServiceOption {
  id: string;
  name: string;
  slug: string;
  durationMin: number;
}

export function getOwnerQueue(businessId: string): Promise<LiveQueue | null> {
  return ownerGet<LiveQueue>(
    `v1/businesses/${encodeURIComponent(businessId)}/queue`,
  );
}

export async function getOwnerServices(
  businessId: string,
): Promise<OwnerServiceOption[]> {
  const services = await ownerGet<OwnerServiceOption[]>(
    `v1/businesses/${encodeURIComponent(businessId)}/queue/services`,
  );
  return services ?? [];
}
