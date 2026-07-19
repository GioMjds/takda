'use client';

import { motion } from 'motion/react';
import type { Slot } from '@takda/shared';
import { Clock, Info } from 'lucide-react';

export interface SlotGridProps {
  slots: Slot[];
  selectedSlotStart: string;
  onSelect: (slotStart: string) => void;
  lang: string;
}

export default function SlotGrid({
  slots = [],
  selectedSlotStart = '',
  onSelect,
  lang = 'tl',
}: Partial<SlotGridProps>) {
  if (!slots || !onSelect) {
    return null;
  }
  // Format UTC datetime to Manila local time (HH:MM AM/PM)
  const formatTime = (utcString: string) => {
    try {
      const date = new Date(utcString);
      return date.toLocaleTimeString(lang === 'en' ? 'en-US' : 'en-PH', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Filter out slots that are in the past relative to Manila local time
  const manilaNow = new Date();
  const activeSlots = slots.filter((slot) => {
    const slotTime = new Date(slot.slotStart);
    // Include all slots starting from now
    return slotTime.getTime() > manilaNow.getTime();
  });

  const selectedSlot = slots.find((s) => s.slotStart === selectedSlotStart);
  
  // Optimistic queue position (current booked count + 1)
  const optimisticQueuePosition = selectedSlot ? selectedSlot.bookedCount + 1 : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-[#0d4f43]/80 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="size-4 text-[#1a8c75]" />
          {lang === 'en' ? 'Available Times for Today' : 'Mga Oras Ngayong Araw'}
        </h2>
        <span className="text-xs text-[#0d4f43]/60 font-medium">
          {activeSlots.length} {lang === 'en' ? 'slots left' : 'oras natitira'}
        </span>
      </div>

      {activeSlots.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl text-center font-medium">
          {lang === 'en' 
            ? 'No more available slots for today. Please check back tomorrow!' 
            : 'Wala nang bakanteng oras ngayon. Subukan po ulit bukas!'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {activeSlots.map((slot) => {
            const isSelected = slot.slotStart === selectedSlotStart;
            const timeLabel = formatTime(slot.slotStart);

            if (!slot.isAvailable) {
              return (
                <button
                  key={slot.slotStart}
                  type="button"
                  disabled
                  className="py-3 px-2 border border-gray-200 bg-gray-100/50 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed min-h-12 flex items-center justify-center text-center opacity-60"
                  aria-disabled="true"
                >
                  <span className="line-through">{timeLabel}</span>
                </button>
              );
            }

            return (
              <button
                key={slot.slotStart}
                type="button"
                onClick={() => onSelect(slot.slotStart)}
                className={`py-3 px-2 border rounded-lg text-xs font-bold transition-all duration-200 text-center min-h-12 flex flex-col items-center justify-center gap-0.5 outline-none ${
                  isSelected
                    ? 'border-[#1a8c75] bg-[#e3f5f0] text-[#0d4f43] ring-2 ring-[#a8ddd4] font-extrabold shadow-[0_4px_12px_rgba(26,140,117,0.06)]'
                    : 'border-[#a8ddd4]/40 bg-white hover:border-[#1a8c75] text-[#0d4f43]'
                }`}
              >
                <span>{timeLabel}</span>
                {slot.bookedCount > 0 && !isSelected && (
                  <span className="text-[9px] text-[#0d4f43]/60 font-medium">
                    {slot.bookedCount} {lang === 'en' ? 'booked' : 'naka-book'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Optimistic Queue Position display with aria-live="polite" */}
      {selectedSlot && optimisticQueuePosition !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[#e3f5f0]/50 border border-[#a8ddd4]/30 rounded-xl p-3.5 flex items-start gap-2.5"
        >
          <Info className="size-5 text-[#1a8c75] shrink-0 mt-0.5" />
          <div className="text-xs text-[#0d4f43] font-medium space-y-0.5">
            <p>
              {lang === 'en' 
                ? 'You are booking for ' 
                : 'Ikaw ay magbu-book para sa '}
              <strong className="font-bold text-[#1a8c75]">{formatTime(selectedSlot.slotStart)}</strong>.
            </p>
            <p aria-live="polite" className="font-semibold">
              {lang === 'en' 
                ? `Optimistic Queue Position: #${optimisticQueuePosition} (Estimated)` 
                : `Tantiyang Posisyon sa Pila: #${optimisticQueuePosition}`}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
