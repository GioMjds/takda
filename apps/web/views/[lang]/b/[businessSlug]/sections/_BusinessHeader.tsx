'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';

export interface BusinessHeaderProps {
  name: string;
  category: string;
  isOpen: boolean;
  isFull: boolean;
  address?: string | null;
  phone?: string | null;
  lang: string;
  logoUrl?: string;
}

export default function BusinessHeader({
  name,
  category = '',
  isOpen = true,
  isFull = false,
  address,
  phone,
  lang = 'tl',
  logoUrl,
}: Partial<BusinessHeaderProps>) {
  if (!name) {
    return null;
  }
  // Localized statuses
  const statusLabel = isFull
    ? lang === 'en'
      ? 'Fully Booked'
      : 'Puno na Ngayon'
    : isOpen
      ? lang === 'en'
        ? 'Open Today'
        : 'Bukás Ngayon'
      : lang === 'en'
        ? 'Closed'
        : 'Sarado';

  const statusColorClass = isFull
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : isOpen
      ? 'bg-[#e3f5f0] text-[#0d4f43] border-[#a8ddd4]/40'
      : 'bg-rose-100 text-rose-800 border-rose-200';

  // Stylized letter code if no logoUrl is provided
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full text-center space-y-4"
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Above-the-fold logo with priority loading */}
        <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-[#a8ddd4] flex items-center justify-center shadow-[0_4px_12px_rgba(26,140,117,0.08)] overflow-hidden">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} Logo`}
              fill
              priority
              className="object-cover"
              sizes="80px"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPsr6+vBwAEhQGaA9v7WAAAAABJRU5ErkJggg=="
            />
          ) : (
            <span className="font-extrabold text-2xl text-[#1a8c75] tracking-wide">
              {initials}
            </span>
          )}
        </div>

        {/* Business Title & Category */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0d4f43] tracking-tight font-display">
            {name}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e3f5f0] text-[#0d4f43] border border-[#a8ddd4]/30">
              {category}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColorClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Address & Phone info */}
      {(address || phone) && (
        <div className="flex flex-col items-center justify-center gap-1.5 text-sm text-[#0d4f43]/70 font-medium">
          {address && (
            <div className="flex items-center gap-1">
              <MapPin className="size-4 text-[#1a8c75]" />
              <span>{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-4 text-[#1a8c75]" />
              <span>{phone}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
