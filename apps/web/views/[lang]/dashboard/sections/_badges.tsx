'use client';

import type { BookingStatus, PriorityTier } from '@takda/shared';

/// Shared status + priority badge helpers for the owner dashboard. Kept in one
/// place so the live queue and history views render statuses identically.

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
  CHECKED_IN: 'bg-[#e3f5f0] text-[#0d4f43] border-[#a8ddd4]/60',
  SERVING: 'bg-[#1a8c75] text-white border-[#0d4f43]',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  NO_SHOW: 'bg-red-50 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-300',
};

const STATUS_LABELS: Record<BookingStatus, { en: string; tl: string }> = {
  PENDING: { en: 'Pending', tl: 'Naka-pila' },
  CONFIRMED: { en: 'Confirmed', tl: 'Kumpirmado' },
  CHECKED_IN: { en: 'Checked In', tl: 'Naka-check In' },
  SERVING: { en: 'Serving', tl: 'Sineserbisyo' },
  COMPLETED: { en: 'Completed', tl: 'Tapos na' },
  NO_SHOW: { en: 'No Show', tl: 'Hindi Dumating' },
  CANCELLED: { en: 'Cancelled', tl: 'Kanselado' },
};

export function StatusBadge({
  status,
  lang,
}: {
  status: BookingStatus;
  lang: string;
}) {
  const label = STATUS_LABELS[status];
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}
    >
      {lang === 'en' ? label.en : label.tl}
    </span>
  );
}

const TIER_STYLES: Record<PriorityTier, string> = {
  VIP: 'bg-purple-100 text-purple-800 border-purple-300',
  PREGNANT: 'bg-pink-100 text-pink-800 border-pink-300',
  PWD: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  SENIOR: 'bg-orange-100 text-orange-800 border-orange-300',
  STANDARD: '',
};

const TIER_LABELS: Record<PriorityTier, string> = {
  VIP: 'VIP',
  PREGNANT: 'Pregnant',
  PWD: 'PWD',
  SENIOR: 'Senior',
  STANDARD: 'Standard',
};

/// Renders nothing for STANDARD (the default) to avoid badge noise.
export function PriorityBadge({ tier }: { tier: PriorityTier }) {
  if (tier === 'STANDARD') return null;
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${TIER_STYLES[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

export const PRIORITY_TIERS: PriorityTier[] = [
  'STANDARD',
  'VIP',
  'PREGNANT',
  'PWD',
  'SENIOR',
];

export { TIER_LABELS };
