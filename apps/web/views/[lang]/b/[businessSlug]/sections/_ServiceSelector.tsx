'use client';

import type { Service } from '@takda/shared';
import { Sparkles } from 'lucide-react';

export interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string;
  onSelect: (id: string) => void;
  lang: string;
}

export default function ServiceSelector({
  services = [],
  selectedServiceId,
  onSelect,
  lang,
}: Partial<ServiceSelectorProps>) {
  if (!services || services.length <= 1 || !onSelect) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-[#0d4f43]/80 uppercase tracking-wider">
        {lang === 'en' ? 'Select a Service' : 'Pumili ng Serbisyo'}
      </h2>
      <div className="grid grid-cols-1 gap-2.5">
        {services.map((service) => {
          const isSelected = service.id === selectedServiceId;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              className={`w-full text-left p-4 rounded-xl border text-[#0d4f43] transition-all min-h-12 duration-200 outline-none flex justify-between items-center ${
                isSelected
                  ? 'border-[#1a8c75] bg-[#e3f5f0] ring-2 ring-[#a8ddd4] shadow-[0_4px_12px_rgba(26,140,117,0.04)]'
                  : 'border-[#a8ddd4]/40 bg-white hover:border-[#1a8c75]/50'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-base flex items-center gap-1.5">
                  {service.name}
                  {isSelected && <Sparkles className="size-4 text-[#1a8c75] fill-[#1a8c75]/20 animate-pulse" />}
                </div>
                {service.description && (
                  <p className="text-xs text-[#0d4f43]/70 font-medium">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="text-right text-xs font-semibold text-[#1a8c75] bg-[#e3f5f0] px-2.5 py-1 rounded-md">
                {service.durationMin} {lang === 'en' ? 'mins' : 'minuto'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
