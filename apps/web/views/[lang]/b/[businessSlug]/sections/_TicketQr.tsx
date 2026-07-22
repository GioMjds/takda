'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';

export interface TicketQrProps {
  /// Ticket number issued at booking (daily, per-business). Null for legacy
  /// bookings that predate numbering.
  ticketNumber?: number | null;
  /// The customer's own status/position deep-link. Scanning it reopens this
  /// ticket on another device (e.g. a companion's phone at the storefront).
  statusUrl: string;
  lang: string;
}

/// QR ticket (#23). Renders the customer's queue ticket number plus a scannable
/// QR that deep-links back to their live position page. Collapsible so it stays
/// out of the way on the confirmation screen until the customer wants it.
export function TicketQr(props: TicketQrProps) {
  const { ticketNumber, statusUrl, lang } = props;
  const [open, setOpen] = useState(false);

  const t = (en: string, tl: string) => (lang === 'en' ? en : tl);

  return (
    <div className="mt-6 rounded-2xl border border-teal-100 bg-white p-5 text-center shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-[#0d4f43]"
        aria-expanded={open}
        aria-controls="ticket-qr-body"
      >
        <span>{t('Show my QR ticket', 'Ipakita ang aking QR ticket')}</span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div id="ticket-qr-body" className="mt-4 flex flex-col items-center gap-3">
          {ticketNumber != null && (
            <div className="text-4xl font-black text-teal-600">
              #{ticketNumber}
            </div>
          )}
          <div className="rounded-xl bg-white p-3" aria-hidden={false}>
            <QRCode
              value={statusUrl}
              size={160}
              level="M"
              className="h-40 w-40"
            />
          </div>
          <p className="max-w-xs text-xs text-gray-500">
            {t(
              'Scan to reopen your queue status on another phone.',
              'I-scan upang buksan muli ang iyong pila sa ibang telepono.',
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default TicketQr;
