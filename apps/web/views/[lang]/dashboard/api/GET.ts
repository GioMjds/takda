'use client';

import type { LiveQueue, QueueHistoryResponse } from '@takda/shared';

/// Client-side reads for the owner dashboard. Every call goes through the
/// same-origin BFF proxy (`/api/owner/...`) which attaches the owner's JWT
/// from the httpOnly cookie — the token never touches client JS.

async function ownerGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/owner/${path}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && (json.message || json?.data?.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (json?.data ?? json) as T;
}

/// Today's live queue snapshot for a business (#12/#16/#18).
export function fetchLiveQueue(businessId: string): Promise<LiveQueue> {
  return ownerGet<LiveQueue>(
    `v1/businesses/${encodeURIComponent(businessId)}/queue`,
  );
}

/// One active service for the walk-in / transfer pickers.
export interface DashboardService {
  id: string;
  name: string;
  slug: string;
  durationMin: number;
}

/// Active services for the walk-in modal (#16) and transfer picker (#22).
export function fetchServices(
  businessId: string,
): Promise<DashboardService[]> {
  return ownerGet<DashboardService[]>(
    `v1/businesses/${encodeURIComponent(businessId)}/queue/services`,
  );
}

/// Paginated queue history with wait-time stats (#25).
export function fetchQueueHistory(
  businessId: string,
  query: {
    date?: string;
    serviceId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<QueueHistoryResponse> {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.serviceId) params.set('serviceId', query.serviceId);
  if (query.status) params.set('status', query.status);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const qs = params.toString();
  return ownerGet<QueueHistoryResponse>(
    `v1/businesses/${encodeURIComponent(businessId)}/queue/history${
      qs ? `?${qs}` : ''
    }`,
  );
}
