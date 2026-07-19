'use client';

import { motion } from 'motion/react';
import { CheckCircle2, MapPin, Calendar, Users, MessageSquare } from 'lucide-react';
import type { Booking } from '@takda/shared';

export interface ConfirmationCardProps {
  booking: Booking & { queuePosition: number };
  businessName: string;
  businessAddress?: string | null;
  lang: string;
  onReset: () => void;
}

export default function ConfirmationCard({
  booking,
  businessName = '',
  businessAddress,
  lang = 'tl',
  onReset,
}: Partial<ConfirmationCardProps>) {
  if (!booking || !onReset) {
    return null;
  }
  // Format local slot time
  const formatTime = (dateInput: Date | string) => {
    try {
      const date = new Date(dateInput);
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

  // Format local slot date
  const formatDate = (dateInput: Date | string) => {
    try {
      const date = new Date(dateInput);
      return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white p-6 rounded-2xl border border-[#a8ddd4]/50 text-center space-y-6 shadow-[0_4px_12px_rgba(26,140,117,0.04)]"
    >
      {/* Icon & Success Title */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <CheckCircle2 className="size-14 text-[#1a8c75] fill-[#e3f5f0]" />
        <h2 className="text-2xl font-bold text-[#0d4f43]">
          {lang === 'en' ? 'Booking Confirmed!' : 'Kumpirmadong Booking!'}
        </h2>
        <p className="text-sm text-[#0d4f43]/70 font-medium">
          {lang === 'en' 
            ? `Your turn at ${businessName} is ready.` 
            : `Nareserba na ang iyong slot sa ${businessName}.`}
        </p>
      </div>

      <hr className="border-[#a8ddd4]/30" />

      {/* Booking Details Summary */}
      <div className="space-y-4 text-left">
        {/* Time Detail */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e3f5f0] flex items-center justify-center shrink-0">
            <Calendar className="size-4 text-[#1a8c75]" />
          </div>
          <div className="text-sm text-[#0d4f43] font-medium">
            <p className="text-xs text-[#0d4f43]/60">
              {lang === 'en' ? 'Date & Time' : 'Petsa at Oras'}
            </p>
            <p className="font-bold text-base text-[#1a8c75]">
              {formatTime(booking.slotStart)}
            </p>
            <p className="text-xs text-[#0d4f43]/70">
              {formatDate(booking.slotStart)}
            </p>
          </div>
        </div>

        {/* Queue Position */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e3f5f0] flex items-center justify-center shrink-0">
            <Users className="size-4 text-[#1a8c75]" />
          </div>
          <div className="text-sm text-[#0d4f43] font-medium">
            <p className="text-xs text-[#0d4f43]/60">
              {lang === 'en' ? 'Queue Position' : 'Posisyon sa Pila'}
            </p>
            <p 
              aria-live="polite" 
              className="font-extrabold text-2xl text-[#0d4f43] tracking-tight"
            >
              #{booking.queuePosition}
            </p>
            <p className="text-xs text-[#0d4f43]/60 font-medium">
              {lang === 'en' 
                ? 'Estimated position in line today' 
                : 'Tantiyang pagkakasunod-sunod ngayong araw'}
            </p>
          </div>
        </div>

        {/* Address */}
        {businessAddress && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e3f5f0] flex items-center justify-center shrink-0">
              <MapPin className="size-4 text-[#1a8c75]" />
            </div>
            <div className="text-sm text-[#0d4f43] font-medium">
              <p className="text-xs text-[#0d4f43]/60">
                {lang === 'en' ? 'Address' : 'Address'}
              </p>
              <p className="text-sm text-[#0d4f43]/80">
                {businessAddress}
              </p>
            </div>
          </div>
        )}

        {/* SMS Reminder note */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e3f5f0] flex items-center justify-center shrink-0">
            <MessageSquare className="size-4 text-[#1a8c75]" />
          </div>
          <div className="text-sm text-[#0d4f43] font-medium">
            <p className="text-xs text-[#0d4f43]/60">
              {lang === 'en' ? 'SMS Notifications' : 'SMS Notification'}
            </p>
            <p className="text-sm text-[#0d4f43]/80">
              {lang === 'en' 
                ? "We'll send you an SMS reminder before your slot." 
                : "Magpapadala kami ng SMS na paalala bago ang iyong oras."}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-[#a8ddd4]/30" />

      {/* CTAs */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 px-4 border border-[#1a8c75]/30 hover:border-[#1a8c75] text-[#1a8c75] hover:bg-[#e3f5f0]/20 rounded-xl text-sm font-semibold transition min-h-12 flex items-center justify-center"
        >
          {lang === 'en' ? 'Book Another Appointment' : 'Magbu-book Muli'}
        </button>
      </div>
    </motion.div>
  );
}
