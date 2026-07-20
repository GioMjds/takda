'use client';

import React from 'react';
import type { QueuePosition } from '@takda/shared';
import { useQueuePosition } from '../hooks/_useQueuePosition';

export interface PositionCardProps {
  bookingId: string;
  businessId: string;
  businessName: string;
  businessAddress?: string | null;
  initialPosition: QueuePosition;
  queueToken: string;
  queueTokenExpiresAt: string;
  refreshPhone: string;
  dict: any;
}

export function PositionCard(props: PositionCardProps) {
  const { position, totalActive, status, onTapToRejoin } = useQueuePosition({
    bookingId: props.bookingId,
    businessId: props.businessId,
    initialToken: props.queueToken,
    initialPosition: props.initialPosition,
    refreshPhone: props.refreshPhone,
  });

  const activePos = position ?? props.initialPosition;
  const t = props.dict?.positionCard || {
    yourSlot: 'Your Slot',
    yourNumber: 'Your Queue Number',
    estimatedWait: 'Estimated Wait',
    peopleAhead: '{count} people ahead of you',
    youAreNext: "You're next!",
    reconnecting: 'Reconnecting...',
    expired: 'Session expired',
    tapToRejoin: 'Tap to rejoin queue',
    terminalState: 'Your booking is no longer active',
  };

  const formattedTime = new Date(activePos.slotStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isTerminal =
    activePos.status === 'CHECKED_IN' ||
    activePos.status === 'NO_SHOW' ||
    activePos.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl border border-teal-100">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{props.businessName}</h2>
          {props.businessAddress && (
            <p className="text-sm text-gray-500">{props.businessAddress}</p>
          )}
        </div>
        {status === 'reconnecting' && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {t.reconnecting}
          </span>
        )}
      </div>

      <div className="my-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
          {t.yourNumber}
        </p>
        <p className="my-2 text-6xl font-black text-teal-600">{`#${activePos.position}`}</p>
        <p className="text-sm font-semibold text-teal-800">
          {activePos.peopleAhead === 0
            ? t.youAreNext
            : t.peopleAhead.replace('{count}', String(activePos.peopleAhead))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4 text-center">
        <div>
          <p className="text-xs text-gray-500">{t.yourSlot}</p>
          <p className="text-base font-semibold text-gray-900">{formattedTime}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t.estimatedWait}</p>
          <p className="text-base font-semibold text-gray-900">
            {`~${activePos.estimatedWaitMin} min`}
          </p>
        </div>
      </div>

      {totalActive !== null && (
        <p className="mt-4 text-center text-xs text-gray-400">
          {`${totalActive} total active bookings today`}
        </p>
      )}

      {isTerminal && (
        <div className="mt-4 rounded-xl bg-gray-100 p-3 text-center text-sm font-medium text-gray-600">
          {t.terminalState}
        </div>
      )}

      {status === 'expired' && (
        <button
          onClick={onTapToRejoin}
          className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition"
        >
          {t.tapToRejoin}
        </button>
      )}
    </div>
  );
}

export default PositionCard;
