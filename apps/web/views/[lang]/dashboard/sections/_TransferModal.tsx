'use client';

import { useState } from 'react';
import type { WalkInService } from './_WalkInModal';

export interface TransferModalProps {
  open: boolean;
  lang: string;
  services: WalkInService[];
  /// The service the booking is currently on, so we can exclude / mark it.
  currentServiceId: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (targetServiceId: string) => Promise<boolean>;
}

/// Owner-facing transfer form (#22). Moves a booking to another service. Slot
/// time is kept as-is by the API when omitted, so this only picks the target
/// service in v1.
export function TransferModal(props: TransferModalProps) {
  const {
    open,
    lang,
    services,
    currentServiceId,
    submitting,
    error,
    onClose,
    onSubmit,
  } = props;

  const [targetServiceId, setTargetServiceId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!open) return null;

  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);
  const options = services.filter((s) => s.id !== currentServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    if (!targetServiceId) {
      setFieldError(t('Pick a target service', 'Pumili ng serbisyo'));
      return;
    }
    const ok = await onSubmit(targetServiceId);
    if (ok) {
      setTargetServiceId('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 id="transfer-title" className="text-lg font-bold text-[#0d4f43]">
            {t('Transfer Customer', 'Ilipat ang Customer')}
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
              htmlFor="transfer-service"
              className="block text-xs font-semibold text-[#0d4f43]/80 mb-1"
            >
              {t('Transfer to service', 'Ilipat sa serbisyo')}
            </label>
            <select
              id="transfer-service"
              value={targetServiceId}
              onChange={(e) => setTargetServiceId(e.target.value)}
              className="w-full rounded-lg border border-[#a8ddd4]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8c75]"
              required
            >
              <option value="">
                {t('Select a service…', 'Pumili ng serbisyo…')}
              </option>
              {options.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {t(
                  'No other services to transfer to.',
                  'Walang ibang serbisyo na mapaglilipatan.',
                )}
              </p>
            )}
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
              disabled={submitting || options.length === 0}
              className="flex-1 rounded-lg bg-[#1a8c75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d4f43] disabled:opacity-60"
            >
              {submitting
                ? t('Transferring…', 'Inililipat…')
                : t('Transfer', 'Ilipat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
