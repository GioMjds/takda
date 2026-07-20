'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Clock,
  Phone,
  User,
  ArrowRight,
  CheckCircle2,
  Radio,
  ChevronRight,
  Lock,
} from 'lucide-react';

export interface DemoFrameProps {
  lang: string;
}

export function DemoFrame({ lang }: DemoFrameProps) {
  const isEn = lang === 'en';
  const reduceMotion = useReducedMotion();

  const slotTimes = [
    { time: '8:00 AM', state: 'available' as const },
    { time: '8:15 AM', state: 'full' as const },
    { time: '8:30 AM', state: 'full' as const },
    { time: '8:45 AM', state: 'available' as const },
    { time: '9:00 AM', state: 'selected' as const },
    { time: '9:15 AM', state: 'available' as const },
    { time: '9:30 AM', state: 'available' as const },
    { time: '9:45 AM', state: 'full' as const },
    { time: '10:00 AM', state: 'available' as const },
  ];

  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [queueCount, setQueueCount] = useState<number>(7);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setTimeout(() => setQueueCount(8), 3200);
    return () => clearTimeout(id);
  }, [reduceMotion]);

  return (
    <section
      aria-labelledby="demo-title"
      className="relative mx-auto w-full max-w-6xl px-6 sm:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      >
        {/* Browser chrome — a hairline traffic-light row + URL bar.
            Visually it reads as "this is a screenshot of the app",
            which is the entire point of a marketing demo. */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>

          <div className="mx-auto flex h-7 w-full max-w-md items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3">
            <Lock className="size-3 text-white/30" aria-hidden="true" />
            <span className="truncate font-mono text-[11px] text-white/55">
              takda.app/b/josefs-barbershop
            </span>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Split content */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── LEFT: customer booking UI ─────────────────────── */}
          <div className="border-b border-white/[0.06] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <CustomerPanel
              isEn={isEn}
              slotTimes={slotTimes}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
            />
          </div>

          {/* ── RIGHT: owner live queue ───────────────────────── */}
          <div className="p-5 sm:p-7">
            <OwnerQueuePanel isEn={isEn} liveCount={queueCount} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Customer panel
   ──────────────────────────────────────────────────────────────────── */

function CustomerPanel({
  isEn,
  slotTimes,
  selectedTime,
  onSelect,
}: {
  isEn: boolean;
  slotTimes: ReadonlyArray<{ time: string; state: 'available' | 'full' | 'selected' }>;
  selectedTime: string;
  onSelect: (time: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Business header — stylized to match the real customer route's
          `BusinessHeader` so the demo looks like a screenshot, not a
          recreation. The badge strip uses the same teal-on-mint recipe
          as the live component, transposed onto the dark surface. */}
      <header className="flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] font-[family-name:var(--font-display)] text-base font-extrabold text-[#5DCAA5]"
          aria-hidden="true"
        >
          JB
        </div>
        <h3
          id="demo-title"
          className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-[#e8f5ef]"
        >
          {isEn ? "Josef's Barbershop" : "Barbershop ni Josef"}
        </h3>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1D9E75]/40 bg-[#1D9E75]/15 px-2 py-0.5 text-[10px] font-semibold text-[#5DCAA5]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] shadow-[0_0_8px_1px_rgba(29,158,117,0.6)]"
            />
            {isEn ? 'Open today' : 'Bukás ngayon'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/65">
            {isEn ? 'Gupit · 30 min' : 'Gupit · 30 min'}
          </span>
        </div>
      </header>

      {/* Slot grid */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
            <Clock className="size-3 text-[#5DCAA5]" aria-hidden="true" />
            {isEn ? 'Available times' : 'Mga oras'}
          </p>
          <p className="font-mono text-[10px] text-white/40">
            {isEn ? '5 slots left' : '5 slots natitira'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {slotTimes.map((slot) => {
            const isSelected = slot.state === 'selected' || slot.time === selectedTime;

            if (slot.state === 'full' && !isSelected) {
              return (
                <span
                  key={slot.time}
                  aria-disabled="true"
                  className="flex h-8 items-center justify-center rounded-md border border-white/[0.04] bg-white/[0.015] font-mono text-[11px] font-medium text-white/25 line-through"
                >
                  {slot.time}
                </span>
              );
            }

            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => onSelect(slot.time)}
                aria-pressed={isSelected}
                className={`flex h-8 items-center justify-center rounded-md font-mono text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'border border-[#5DCAA5] bg-[#1D9E75] text-white shadow-[0_4px_18px_-6px_rgba(29,158,117,0.7)]'
                    : 'border border-white/[0.08] bg-white/[0.03] text-[#e8f5ef] hover:border-white/20'
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact form — two fields + a primary CTA. Each input is
          visually identical to the live booking form's chrome,
          resized to the demo frame. */}
      <div className="space-y-2.5">
        <FormField icon={<User className="size-3.5" />} value={isEn ? 'Maria Santos' : 'Maria Santos'} />
        <FormField
          icon={<Phone className="size-3.5" />}
          value="+63 917 555 0142"
        />
        <button
          type="button"
          className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1D9E75] text-sm font-semibold text-white transition-colors hover:bg-[#5DCAA5] hover:text-[#0a1f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DCAA5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1a]"
        >
          <span>{isEn ? 'Reserve 9:00 AM' : 'I-reserve ang 9:00 AM'}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FormField({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3">
      <span className="text-white/45" aria-hidden="true">
        {icon}
      </span>
      <span className="font-mono text-[12px] text-[#e8f5ef]/85">{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Owner live-queue panel
   ──────────────────────────────────────────────────────────────────── */

function OwnerQueuePanel({ isEn, liveCount }: { isEn: boolean; liveCount: number }) {
  // Queue rows. Hardcoded illustration; the brief specifies three
  // status kinds. Times are Manila local, monospace.
  const rows: ReadonlyArray<{
    position: number;
    name: string;
    time: string;
    status: 'confirmed' | 'checked_in' | 'walk_in';
  }> = [
    { position: 1, name: 'JR · Jose R.', time: '08:15', status: 'checked_in' },
    { position: 2, name: 'MA · Maria A.', time: '08:30', status: 'confirmed' },
    { position: 3, name: 'PD · Pedro D.', time: '08:45', status: 'walk_in' },
    { position: 4, name: 'SL · Sandra L.', time: '09:00', status: 'confirmed' },
    { position: 5, name: 'NM · Nestor M.', time: '09:15', status: 'confirmed' },
  ];

  return (
    <div className="space-y-4">
      {/* Header strip — live count + today counter. The count animates
          to suggest a websocket subscription. */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D9E75] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5DCAA5]" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
            {isEn ? 'Live queue' : 'Live na pila'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Radio className="size-3 text-[#5DCAA5]" aria-hidden="true" />
          <span className="font-mono text-[11px] text-white/65">
            {liveCount} {isEn ? 'in line' : 'nasa pila'}
          </span>
        </div>
      </div>

      {/* Queue rows */}
      <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.06] bg-white/[0.015]">
        {rows.map((row) => (
          <QueueRow key={row.position} {...row} isEn={isEn} />
        ))}
      </ul>

      {/* Footer hint — opens up the demo to a follow-up CTA ("see it
          live for your business") rather than dead-ending the reader. */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
        <p className="text-[10px] font-medium text-white/50">
          {isEn ? 'Updated a moment ago' : 'Na-update kamakailan'}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5DCAA5] transition-colors hover:text-white"
        >
          {isEn ? 'Open full queue' : 'Buksan ang buong pila'}
          <ChevronRight className="size-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function QueueRow({
  position,
  name,
  time,
  status,
  isEn,
}: {
  position: number;
  name: string;
  time: string;
  status: 'confirmed' | 'checked_in' | 'walk_in';
  isEn: boolean;
}) {
  const statusConfig = {
    confirmed: {
      label: isEn ? 'Confirmed' : 'Kumpirmado',
      cls: 'border-[#1D9E75]/35 bg-[#1D9E75]/15 text-[#5DCAA5]',
    },
    checked_in: {
      label: isEn ? 'Checked in' : 'Nasa counter',
      cls: 'border-amber-400/35 bg-amber-400/12 text-amber-200',
    },
    walk_in: {
      label: isEn ? 'Walk-in' : 'Walk-in',
      cls: 'border-violet-400/35 bg-violet-400/12 text-violet-200',
    },
  } as const;

  const s = statusConfig[status];

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[10px] font-bold text-white/70"
      >
        {position}
      </span>
      <span className="flex-1 truncate text-[12px] font-medium text-[#e8f5ef]/90">
        {name}
      </span>
      <span className="hidden font-mono text-[11px] text-white/45 sm:inline">
        {time}
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${s.cls}`}
      >
        {status === 'checked_in' ? (
          <CheckCircle2 className="size-2.5" aria-hidden="true" />
        ) : null}
        {s.label}
      </span>
    </li>
  );
}

export default DemoFrame;
