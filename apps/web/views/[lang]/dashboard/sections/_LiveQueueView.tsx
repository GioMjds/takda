'use client';

import { useMemo, useState } from 'react';
import type {
  LiveQueue,
  LiveQueueEntry,
  PriorityTier,
} from '@takda/shared';
import { useLiveQueue } from '../hooks/_useLiveQueue';
import { useQueueActions } from '../hooks/_useQueueActions';
import { fetchServices } from '../api/GET';
import { StatusBadge, PriorityBadge, PRIORITY_TIERS, TIER_LABELS } from './_badges';
import { WalkInModal, type WalkInService } from './_WalkInModal';
import { TransferModal } from './_TransferModal';

export interface LiveQueueViewProps {
  businessId: string;
  businessName: string;
  lang: string;
  initialQueue: LiveQueue | null;
  initialServices: WalkInService[];
}

/// The owner dashboard's live queue (#12). Polls the queue over REST (see
/// `useLiveQueue`), and exposes every owner action: call-next (#17),
/// complete (#24), recall (#19), skip (#20), cancel (#21), set-priority (#18),
/// transfer (#22), and add walk-in (#16). All mutations refetch immediately.
export function LiveQueueView(props: LiveQueueViewProps) {
  const { businessId, businessName, lang, initialQueue, initialServices } =
    props;

  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);

  const { queue, status, error, refresh } = useLiveQueue({
    businessId,
    initial: initialQueue,
  });

  const actions = useQueueActions({ businessId, onMutated: refresh });

  const [services, setServices] = useState<WalkInService[]>(initialServices);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [transferFor, setTransferFor] = useState<LiveQueueEntry | null>(null);

  const entries = queue?.entries ?? [];
  const serving = useMemo(
    () => entries.find((e) => e.status === 'SERVING') ?? null,
    [entries],
  );
  const waiting = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.status === 'PENDING' ||
          e.status === 'CONFIRMED' ||
          e.status === 'CHECKED_IN',
      ),
    [entries],
  );

  const counts = useMemo(() => {
    let waitingCount = 0;
    let completed = 0;
    let noShow = 0;
    for (const e of entries) {
      if (
        e.status === 'PENDING' ||
        e.status === 'CONFIRMED' ||
        e.status === 'CHECKED_IN'
      )
        waitingCount += 1;
      else if (e.status === 'COMPLETED') completed += 1;
      else if (e.status === 'NO_SHOW') noShow += 1;
    }
    return { waitingCount, completed, noShow, total: entries.length };
  }, [entries]);

  const ensureServices = async () => {
    if (services.length === 0) {
      try {
        setServices(await fetchServices(businessId));
      } catch {
        // Surface nothing; the modal shows an empty picker and the user can retry.
      }
    }
  };

  const openWalkIn = async () => {
    await ensureServices();
    setWalkInOpen(true);
  };

  const openTransfer = async (entry: LiveQueueEntry) => {
    await ensureServices();
    setTransferFor(entry);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
            {t('Live Queue', 'Live na Pila')}
          </h1>
          <p className="text-sm text-[#0d4f43]/80 mt-1">{businessName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              status === 'live'
                ? 'bg-[#e3f5f0] text-[#1a8c75]'
                : status === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'live'
                  ? 'bg-[#1a8c75] animate-pulse'
                  : status === 'error'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
              }`}
            />
            {status === 'live'
              ? t('Live', 'Live')
              : status === 'error'
                ? t('Offline', 'Offline')
                : t('Connecting…', 'Kumokonekta…')}
          </span>
          <button
            type="button"
            onClick={openWalkIn}
            className="rounded-lg bg-[#1a8c75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d4f43] transition"
          >
            + {t('Walk-in', 'Walk-in')}
          </button>
        </div>
      </div>

      {(error || actions.error) && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between"
          role="alert"
        >
          <span>{actions.error || error}</span>
          {actions.error && (
            <button
              type="button"
              onClick={actions.clearError}
              className="text-red-500 hover:text-red-800 font-semibold"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Waiting', 'Naghihintay'), val: counts.waitingCount, color: 'border-[#a8ddd4]/40' },
          { label: t('Serving', 'Sineserbisyo'), val: serving ? 1 : 0, color: 'border-[#1a8c75]' },
          { label: t('Completed', 'Tapos na'), val: counts.completed, color: 'border-emerald-300' },
          { label: t('No Show', 'Hindi Dumating'), val: counts.noShow, color: 'border-red-300' },
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

      {/* Now serving */}
      <div className="bg-white rounded-[10px] border border-[#a8ddd4]/40 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#a8ddd4]/30 bg-[#f7fafa]/50">
          <h2 className="text-lg font-bold text-[#0d4f43]">
            {t('Now Serving', 'Kasalukuyang Sineserbisyo')}
          </h2>
        </div>
        <div className="p-6">
          {serving ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1a8c75] text-white flex items-center justify-center font-extrabold text-lg">
                  {serving.ticketNumber != null ? `#${serving.ticketNumber}` : '—'}
                </div>
                <div>
                  <div className="font-bold text-[#0d4f43] text-lg flex items-center gap-2">
                    {serving.customerName}
                    <PriorityBadge tier={serving.priorityTier} />
                  </div>
                  <div className="text-xs text-[#0d4f43]/70 mt-0.5">
                    {serving.serviceName ?? t('Service', 'Serbisyo')} ·{' '}
                    {serving.customerPhone}
                    {serving.recallCount > 0 && (
                      <span className="ml-2 text-amber-700 font-semibold">
                        {t('Recalled', 'Muling tinawag')} ×{serving.recallCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => actions.complete(serving.bookingId)}
                  disabled={actions.pending !== null}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {t('Complete', 'Tapusin')}
                </button>
                <button
                  type="button"
                  onClick={() => actions.recall(serving.bookingId)}
                  disabled={actions.pending !== null}
                  className="px-4 py-2 border border-amber-300 text-amber-800 text-sm font-semibold rounded-lg hover:bg-amber-50 disabled:opacity-60 transition"
                >
                  {t('Recall', 'Tawagin muli')}
                </button>
                <button
                  type="button"
                  onClick={() => actions.skip(serving.bookingId)}
                  disabled={actions.pending !== null}
                  className="px-4 py-2 border border-red-200 text-red-800 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-60 transition"
                >
                  {t('Skip', 'Laktawan')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[#0d4f43]/70">
                {t('Nobody at the counter.', 'Walang tao sa counter.')}
              </p>
              <button
                type="button"
                onClick={() => actions.next()}
                disabled={actions.pending !== null || waiting.length === 0}
                className="px-5 py-2.5 bg-[#1a8c75] text-white text-sm font-bold rounded-lg hover:bg-[#0d4f43] disabled:opacity-50 transition"
              >
                {t('Call Next', 'Tawagin ang Susunod')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Waiting list */}
      <div className="bg-white rounded-[10px] border border-[#a8ddd4]/40 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#a8ddd4]/30 flex justify-between items-center bg-[#f7fafa]/50">
          <h2 className="text-lg font-bold text-[#0d4f43]">
            {t('Waiting', 'Naghihintay')} ({waiting.length})
          </h2>
          {serving && (
            <button
              type="button"
              onClick={() => actions.next()}
              disabled={actions.pending !== null || waiting.length === 0}
              className="text-xs font-semibold text-[#1a8c75] hover:text-[#0d4f43] disabled:opacity-40"
            >
              {t('Call next', 'Tawagin ang susunod')} →
            </button>
          )}
        </div>

        {status === 'loading' && entries.length === 0 ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : waiting.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#0d4f43]/60">
            {t('No one is waiting in the queue.', 'Walang naghihintay sa pila.')}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {waiting.map((entry) => (
              <QueueRow
                key={entry.bookingId}
                entry={entry}
                lang={lang}
                busy={actions.pending !== null}
                rowPending={actions.pending === entry.bookingId}
                formatTime={formatTime}
                onPrioritize={(tier) =>
                  actions.prioritize(entry.bookingId, tier)
                }
                onSkip={() => actions.skip(entry.bookingId)}
                onCancel={() => {
                  const reason =
                    typeof window !== 'undefined'
                      ? window.prompt(
                          t('Reason for cancelling?', 'Dahilan ng pagkansela?'),
                        ) ?? undefined
                      : undefined;
                  return actions.cancel(entry.bookingId, reason);
                }}
                onTransfer={() => openTransfer(entry)}
              />
            ))}
          </ul>
        )}
      </div>

      <WalkInModal
        open={walkInOpen}
        lang={lang}
        services={services}
        submitting={actions.pending === 'walk-in'}
        error={actions.error}
        onClose={() => setWalkInOpen(false)}
        onSubmit={actions.addWalkIn}
      />

      <TransferModal
        open={transferFor !== null}
        lang={lang}
        services={services}
        currentServiceId={transferFor?.serviceId ?? ''}
        submitting={
          transferFor != null && actions.pending === transferFor.bookingId
        }
        error={actions.error}
        onClose={() => setTransferFor(null)}
        onSubmit={async (targetServiceId) => {
          if (!transferFor) return false;
          const ok = await actions.transfer(
            transferFor.bookingId,
            targetServiceId,
          );
          if (ok) setTransferFor(null);
          return ok;
        }}
      />
    </div>
  );
}

interface QueueRowProps {
  entry: LiveQueueEntry;
  lang: string;
  busy: boolean;
  rowPending: boolean;
  formatTime: (iso: string) => string;
  onPrioritize: (tier: PriorityTier) => Promise<boolean>;
  onSkip: () => Promise<boolean>;
  onCancel: () => Promise<boolean>;
  onTransfer: () => void;
}

function QueueRow(props: QueueRowProps) {
  const {
    entry,
    lang,
    busy,
    rowPending,
    formatTime,
    onPrioritize,
    onSkip,
    onCancel,
    onTransfer,
  } = props;
  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f7fafa]/40 transition">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1a8c75]/10 text-[#1a8c75] flex items-center justify-center font-extrabold text-sm border border-[#a8ddd4]/30">
          {entry.ticketNumber != null ? `#${entry.ticketNumber}` : entry.position}
        </div>
        <div>
          <div className="font-semibold text-[#0d4f43] text-base flex items-center gap-2">
            {entry.customerName}
            <PriorityBadge tier={entry.priorityTier} />
            {entry.source === 'WALK_IN' && (
              <span className="text-[10px] font-bold uppercase text-[#1a8c75] bg-[#e3f5f0] px-1.5 py-0.5 rounded">
                {t('Walk-in', 'Walk-in')}
              </span>
            )}
          </div>
          <div className="text-xs text-[#0d4f43]/75 flex gap-2 mt-0.5 font-medium">
            <span>{entry.customerPhone}</span>
            <span>•</span>
            <span className="text-[#1a8c75] font-bold">
              {formatTime(entry.slotStart)}
            </span>
            {entry.serviceName && (
              <>
                <span>•</span>
                <span>{entry.serviceName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={entry.status} lang={lang} />

        <div className="flex items-center gap-1.5">
          {/* Priority quick-set */}
          <select
            aria-label={t('Set priority', 'Itakda ang prayoridad')}
            value={entry.priorityTier}
            disabled={busy}
            onChange={(e) => onPrioritize(e.target.value as PriorityTier)}
            className="text-xs border border-[#a8ddd4]/60 rounded px-1.5 py-1 text-[#0d4f43] disabled:opacity-50"
          >
            {PRIORITY_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABELS[tier]}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={busy}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="px-2.5 py-1.5 border border-[#a8ddd4]/50 text-[#0d4f43] text-xs font-semibold rounded hover:bg-[#e3f5f0]/50 disabled:opacity-50"
            >
              {rowPending ? '…' : '⋯'}
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onTransfer();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-[#0d4f43] hover:bg-[#f7fafa]"
                >
                  {t('Transfer', 'Ilipat')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void onSkip();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  {t('Skip', 'Laktawan')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void onCancel();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  {t('Cancel', 'Kanselahin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
