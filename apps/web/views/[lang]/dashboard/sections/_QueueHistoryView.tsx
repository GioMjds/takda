'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueueHistoryEntry, QueueHistoryResponse } from '@takda/shared';
import { fetchQueueHistory } from '../api/GET';
import { StatusBadge, PriorityBadge } from './_badges';

export interface QueueHistoryViewProps {
  businessId: string;
  lang: string;
  /// YYYY-MM-DD in the business timezone; defaults to today (client-local).
  initialDate?: string;
}

const PAGE_SIZE = 20;

/// Owner queue history (#25): paginated past bookings for a chosen day plus
/// wait-time / no-show aggregate stats. Reads through the `/api/owner` BFF
/// proxy like the rest of the dashboard.
export function QueueHistoryView(props: QueueHistoryViewProps) {
  const { businessId, lang } = props;
  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);

  const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [date, setDate] = useState(props.initialDate ?? todayStr());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QueueHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQueueHistory(businessId, {
        date,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [businessId, date, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = data?.stats;
  const entries = data?.entries ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const formatTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
            {t('Queue History', 'Kasaysayan ng Pila')}
          </h1>
          <p className="text-sm text-[#0d4f43]/80 mt-1">
            {t(
              'Past bookings and wait-time stats.',
              'Mga nakaraang booking at estadistika ng paghihintay.',
            )}
          </p>
        </div>
        <div>
          <label
            htmlFor="history-date"
            className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
          >
            {t('Date', 'Petsa')}
          </label>
          <input
            id="history-date"
            type="date"
            value={date}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
            className="rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Served', 'Naserbisyuhan'), val: stats?.totalServed ?? 0, color: 'border-emerald-300' },
          { label: t('No Show', 'Hindi Dumating'), val: stats?.totalNoShow ?? 0, color: 'border-red-300' },
          { label: t('Cancelled', 'Kanselado'), val: stats?.totalCancelled ?? 0, color: 'border-gray-300' },
          {
            label: t('Avg Wait', 'Karaniwang Hintay'),
            val: stats ? `${stats.avgWaitMin}m` : '—',
            color: 'border-[#1a8c75]',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white p-5 rounded-[10px] border-l-4 ${stat.color} border-y border-r border-[#a8ddd4]/20 shadow-sm`}
          >
            <div className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-3xl font-extrabold text-[#0d4f43] mt-1">
              {stat.val}
            </div>
          </div>
        ))}
      </div>

      {stats && stats.noShowRate > 0 && (
        <p className="text-xs text-[#0d4f43]/70">
          {t('No-show rate', 'Rate ng hindi pagdating')}:{' '}
          <span className="font-bold">
            {Math.round(stats.noShowRate * 100)}%
          </span>
        </p>
      )}

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-[#a8ddd4]/40 overflow-hidden shadow-sm">
        {loading && entries.length === 0 ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#0d4f43]/60">
            {t('No bookings for this day.', 'Walang booking sa araw na ito.')}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <HistoryRow
                key={entry.bookingId}
                entry={entry}
                lang={lang}
                formatTime={formatTime}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-4 py-2 border border-[#a8ddd4]/60 text-sm font-semibold text-[#0d4f43] rounded-lg disabled:opacity-40 hover:bg-[#e3f5f0]/40"
          >
            ← {t('Previous', 'Nakaraan')}
          </button>
          <span className="text-sm text-[#0d4f43]/70">
            {t('Page', 'Pahina')} {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-4 py-2 border border-[#a8ddd4]/60 text-sm font-semibold text-[#0d4f43] rounded-lg disabled:opacity-40 hover:bg-[#e3f5f0]/40"
          >
            {t('Next', 'Susunod')} →
          </button>
        </div>
      )}
    </div>
  );
}

interface HistoryRowProps {
  entry: QueueHistoryEntry;
  lang: string;
  formatTime: (iso: string | null) => string;
}

function HistoryRow({ entry, lang, formatTime }: HistoryRowProps) {
  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);
  return (
    <li className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1a8c75]/10 text-[#1a8c75] flex items-center justify-center font-extrabold text-sm border border-[#a8ddd4]/30">
          {entry.ticketNumber != null ? `#${entry.ticketNumber}` : '—'}
        </div>
        <div>
          <div className="font-semibold text-[#0d4f43] text-base flex items-center gap-2">
            {entry.customerName}
            <PriorityBadge tier={entry.priorityTier} />
          </div>
          <div className="text-xs text-[#0d4f43]/75 flex gap-2 mt-0.5 font-medium">
            <span>{entry.customerPhone}</span>
            {entry.serviceName && (
              <>
                <span>•</span>
                <span>{entry.serviceName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-[#0d4f43]/70">
          <div>
            {t('Slot', 'Oras')}: {formatTime(entry.slotStart)}
          </div>
          {entry.waitMin != null && (
            <div>
              {t('Waited', 'Naghintay')}: {entry.waitMin}m
            </div>
          )}
        </div>
        <StatusBadge status={entry.status} lang={lang} />
      </div>
    </li>
  );
}
