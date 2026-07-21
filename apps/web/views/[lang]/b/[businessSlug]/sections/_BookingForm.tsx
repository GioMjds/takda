'use client';

import { useFormContext } from 'react-hook-form';
import type { CreateBookingInput } from '@takda/shared';
import { Loader2 } from 'lucide-react';

export interface BookingFormProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  lang: string;
  submitLabel: string;
}

export default function BookingForm({
  isLoading = false,
  error = null,
  onSubmit,
  lang = 'tl',
  submitLabel = '',
}: Partial<BookingFormProps>) {
  const context = useFormContext<CreateBookingInput>();
  if (!onSubmit || !context) {
    return null;
  }
  const {
    register,
    formState: { errors },
  } = context;

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Name */}
      <div className="space-y-1">
        <label
          htmlFor="customerName"
          className="block text-sm font-bold text-[#0d4f43]"
        >
          {lang === 'en' ? 'Your Full Name' : 'Iyong Buong Pangalan'}
        </label>
        <input
          id="customerName"
          type="text"
          disabled={isLoading}
          placeholder={lang === 'en' ? 'e.g. Juan dela Cruz' : 'hal. Juan dela Cruz'}
          className={`mt-1 block w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition ${
            errors.customerName 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-[#a8ddd4]'
          }`}
          {...register('customerName')}
        />
        {errors.customerName && (
          <p className="text-xs font-semibold text-red-600 mt-1">
            {errors.customerName.message}
          </p>
        )}
      </div>

      {/* Customer Phone */}
      <div className="space-y-1">
        <label
          htmlFor="customerPhone"
          className="block text-sm font-bold text-[#0d4f43]"
        >
          {lang === 'en' ? 'Philippine Mobile Number' : 'Numero ng Cellphone'}
        </label>
        <div className="relative mt-1">
          <input
            id="customerPhone"
            type="tel"
            disabled={isLoading}
            placeholder="09XXXXXXXXX"
            className={`block w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition ${
              errors.customerPhone 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-[#a8ddd4]'
            }`}
            {...register('customerPhone')}
          />
        </div>
        {errors.customerPhone && (
          <p className="text-xs font-semibold text-red-600 mt-1">
            {errors.customerPhone.message}
          </p>
        )}
        <p className="text-[11px] text-[#0d4f43]/60 font-medium">
          {lang === 'en' 
            ? 'Format: 09XXXXXXXXX (11 digits)' 
            : 'Format: 09XXXXXXXXX (11 na numero)'}
        </p>
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-1">
        <label
          htmlFor="notes"
          className="block text-sm font-bold text-[#0d4f43]"
        >
          {lang === 'en' ? 'Notes / Requests (Optional)' : 'Mga Dagdag na Detalye (Opsyonal)'}
        </label>
        <textarea
          id="notes"
          rows={3}
          disabled={isLoading}
          placeholder={lang === 'en' ? 'e.g. wheelchair access, senior citizen' : 'hal. kailangan ng wheelchair, senior citizen'}
          className="mt-1 block w-full px-3 py-2 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition resize-none"
          {...register('notes')}
        />
      </div>

      {/* Submit Booking button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200 text-center min-h-12 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {lang === 'en' ? 'Reserving...' : 'Pinapareserba...'}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
