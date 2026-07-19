import { Skeleton } from '@/components/ui/skeleton';

export default function BookingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Business Header skeleton */}
      <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
        {/* Logo circle */}
        <Skeleton className="w-20 h-20 rounded-2xl bg-gray-200" />
        
        {/* Name and badge */}
        <div className="space-y-2 flex flex-col items-center w-full">
          <Skeleton className="h-8 w-48 bg-gray-200" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 bg-gray-200 rounded-full" />
            <Skeleton className="h-5 w-24 bg-gray-200 rounded-full" />
          </div>
        </div>

        {/* Address info line */}
        <Skeleton className="h-4 w-60 bg-gray-200" />
      </div>

      {/* Service list mock if present (we show a compact service placeholder) */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-gray-200" />
        <div className="grid grid-cols-1 gap-2.5">
          <Skeleton className="h-16 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Slots and Form Card wrapper */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
        {/* Slots grid label & grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-40 bg-gray-200" />
            <Skeleton className="h-4 w-16 bg-gray-200" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Booking Form skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-gray-200" />
            <Skeleton className="h-10 w-full bg-gray-200 rounded-lg" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-40 bg-gray-200" />
            <Skeleton className="h-10 w-full bg-gray-200 rounded-lg" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-48 bg-gray-200" />
            <Skeleton className="h-20 w-full bg-gray-200 rounded-lg" />
          </div>

          {/* Submit CTA button */}
          <Skeleton className="h-12 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
