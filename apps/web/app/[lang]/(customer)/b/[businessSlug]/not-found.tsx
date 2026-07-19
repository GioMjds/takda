'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileQuestion, Home } from 'lucide-react';
import type { Route } from 'next';

export default function BusinessNotFound() {
  const pathname = usePathname();
  
  // Detect locale from pathname (e.g., /en/b/something -> en)
  const isTagalog = pathname ? pathname.startsWith('/tl') : true;
  const homePath = (isTagalog ? '/tl' : '/en') as Route;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      {/* Icon with clean design */}
      <div className="w-16 h-16 rounded-2xl bg-[#e3f5f0] flex items-center justify-center border border-[#a8ddd4]/40 text-[#1a8c75] shadow-[0_4px_12px_rgba(26,140,117,0.06)] animate-bounce">
        <FileQuestion className="size-8" />
      </div>

      {/* Localized titles & descriptions */}
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-extrabold text-[#0d4f43] tracking-tight font-display">
          {isTagalog ? 'Negosyo Hindi Nahanap' : 'Business Not Found'}
        </h1>
        <p className="text-sm text-[#0d4f43]/70 font-medium leading-relaxed">
          {isTagalog
            ? 'Hindi nahanap ang negosyong ito. Pakisuri ang link o i-scan muli ang QR code sa tindahan.'
            : 'We could not find this business page. Please check the URL or scan the storefront QR code again.'}
        </p>
      </div>

      {/* Navigation CTA button */}
      <div className="pt-2 w-full max-w-xs">
        <Link
          href={homePath}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200 text-center min-h-12 shadow-[0_4px_12px_rgba(26,140,117,0.08)]"
        >
          <Home className="size-4" />
          {isTagalog ? 'Bumalik sa Simula' : 'Go back to Home'}
        </Link>
      </div>
    </div>
  );
}
