'use client';

import { useState } from 'react';
import type { PriorityTier, WalkInInput } from '@takda/shared';
import { walkInInputSchema } from '@takda/shared';
import { PRIORITY_TIERS, TIER_LABELS } from './_badges';

export interface WalkInService {
  id: string;
  name: string;
  slug: string;
  durationMin: number;
}

export interface WalkInModalProps {
  open: boolean;
  lang: string;
  services: WalkInService[];
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: WalkInInput) => Promise<boolean>;
}

/// Owner-facing walk-in registration form (#16). Adds a physically-present
/// customer to today's queue, optionally with a priority tier. Validates with
/// the shared `walkInInputSchema` before calling the API.
export function WalkInModal(props: WalkInModalProps) {
  const { open, lang, services, submitting, error, onClose, onSubmit } = props;

  const [serviceId, setServiceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priorityTier, setPriorityTier] = useState<PriorityTier>('STANDARD');
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!open) return null;

  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);

  const reset = () => {
    setServiceId('');
    setCustomerName('');
    setCustomerPhone('');
    setPriorityTier('STANDARD');
    setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const parsed = walkInInputSchema.safeParse({
      serviceId,
      customerName,
      customerPhone,
      priorityTier,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? t('Invalid input', 'Di-wastong input'));
      return;
    }

    const ok = await onSubmit(parsed.data);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkin-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 id="walkin-title" className="text-lg font-bold text-[#0d4f43]">
            {t('Add Walk-in', 'Magdagdag ng Walk-in')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label={t('Close', 'Isara')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="walkin-service"
              className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
            >
              {t('Service', 'Serbisyo')}
            </label>
            <select
              id="walkin-service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
              required
            >
              <option value="">
                {t('Select a service…', 'Pumili ng serbisyo…')}
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="walkin-name"
              className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
            >
              {t('Customer name', 'Pangalan ng customer')}
            </label>
            <input
              id="walkin-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Juan dela Cruz"
              className="w-full rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="walkin-phone"
              className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
            >
              {t('Mobile number', 'Numero ng cellphone')}
            </label>
            <input
              id="walkin-phone"
              type="tel"
              inputMode="numeric"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="09XXXXXXXXX"
              className="w-full rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="walkin-priority"
              className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
            >
              {t('Priority', 'Prayoridad')}
            </label>
            <select
              id="walkin-priority"
              value={priorityTier}
              onChange={(e) => setPriorityTier(e.target.value as PriorityTier)}
              className="w-full rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
            >
              {PRIORITY_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABELS[tier]}
                </option>
              ))}
            </select>
          </div>

          {(fieldError || error) && (
            <p className="text-sm text-red-600" role="alert">
              {fieldError || error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('Cancel', 'Kanselahin')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-[#1a8c75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d4f43] disabled:opacity-60"
            >
              {submitting
                ? t('Adding…', 'Idinadagdag…')
                : t('Add to queue', 'Idagdag sa pila')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
