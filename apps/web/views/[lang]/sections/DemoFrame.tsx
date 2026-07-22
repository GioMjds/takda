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
        className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-xl backdrop-blur-md transition-colors"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
          </div>

          <div className="mx-auto flex h-7 w-full max-w-md items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3">
            <Lock className="size-3 text-primary/70" aria-hidden="true" />
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              takda.app/b/josefs-barbershop
            </span>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
          </div>
        </div>

        {/* Split content */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── LEFT: customer booking UI ─────────────────────── */}
          <div className="border-b border-border/50 p-5 sm:p-7 lg:border-b-0 lg:border-r">
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
      <header className="flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-[family-name:var(--font-display)] text-base font-extrabold text-primary dark:text-[#5DCAA5]"
          aria-hidden="true"
        >
          JB
        </div>
        <h3
          id="demo-title"
          className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-foreground"
        >
          {isEn ? "Josef's Barbershop" : "Barbershop ni Josef"}
        </h3>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold text-primary dark:text-[#5DCAA5]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_1px_rgba(29,158,117,0.6)]"
            />
            {isEn ? 'Open today' : 'Bukás ngayon'}
          </span>
          <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {isEn ? 'Gupit · 30 min' : 'Gupit · 30 min'}
          </span>
        </div>
      </header>

      {/* Slot grid */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Clock className="size-3 text-primary" aria-hidden="true" />
            {isEn ? 'Available times' : 'Mga oras'}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70">
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
                  className="flex h-8 items-center justify-center rounded-md border border-border/40 bg-muted/30 font-mono text-[11px] font-medium text-muted-foreground/40 line-through"
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
                    ? 'border border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border/60 bg-background text-foreground hover:border-primary/50 hover:bg-muted'
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact form */}
      <div className="space-y-2.5">
        <FormField icon={<User className="size-3.5" />} value={isEn ? 'Maria Santos' : 'Maria Santos'} />
        <FormField
          icon={<Phone className="size-3.5" />}
          value="+63 917 555 0142"
        />
        <button
          type="button"
          className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
    <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <span className="font-mono text-[12px] font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Owner live-queue panel
   ──────────────────────────────────────────────────────────────────── */

function OwnerQueuePanel({ isEn, liveCount }: { isEn: boolean; liveCount: number }) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {isEn ? 'Live queue' : 'Live na pila'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Radio className="size-3 text-primary" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {liveCount} {isEn ? 'in line' : 'nasa pila'}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/20">
        {rows.map((row) => (
          <QueueRow key={row.position} {...row} isEn={isEn} />
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 px-3 py-2">
        <p className="text-[10px] font-medium text-muted-foreground">
          {isEn ? 'Updated a moment ago' : 'Na-update kamakailan'}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary dark:text-[#5DCAA5] transition-colors hover:underline"
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
      cls: 'border-primary/40 bg-primary/15 text-primary dark:text-[#5DCAA5]',
    },
    checked_in: {
      label: isEn ? 'Checked in' : 'Nasa counter',
      cls: 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300',
    },
    walk_in: {
      label: isEn ? 'Walk-in' : 'Walk-in',
      cls: 'border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-300',
    },
  } as const;

  const s = statusConfig[status];

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground"
      >
        {position}
      </span>
      <span className="flex-1 truncate text-[12px] font-medium text-foreground">
        {name}
      </span>
      <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
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
