import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default async function QRPage({
  params,
}: PageProps<'/[lang]/dashboard/qr'>) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
          {dict.dashboard.tabs.qr}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {lang === 'en'
            ? 'Print and display this QR code at your storefront for customers to scan and book slots.'
            : 'I-print at i-display ang QR code na ito sa iyong tindahan upang mai-scan at makapag-book ang iyong mga customer.'}
        </p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
        {/* Printable Poster Mockup */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="border-4 border-[#0d4f43] p-4 rounded-xl space-y-2">
            <span className="text-xs font-bold text-[#0d4f43] uppercase tracking-widest">
              Scan to Book
            </span>
            {/* SVG Mock QR Code */}
            <div className="w-48 h-48 bg-white border border-gray-200 p-2 flex items-center justify-center relative">
              <svg
                className="w-full h-full text-[#0d4f43]"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                {/* QR corners finder patterns */}
                <path d="M0,0 h30 v10 h-20 v20 h-10 z M0,30 h10 v-20 h20 v-10 z" />
                <rect x="5" y="5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="9" y="9" width="7" height="7" />
                
                <path d="M70,0 h30 v30 h-10 v-20 h-20 z" />
                <rect x="80" y="5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="84" y="9" width="7" height="7" />

                <path d="M0,70 h10 v20 h20 v10 h-30 z" />
                <rect x="5" y="80" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="9" y="84" width="7" height="7" />
                
                {/* Random QR pixels */}
                <rect x="35" y="10" width="8" height="5" />
                <rect x="50" y="15" width="12" height="4" />
                <rect x="45" y="25" width="4" height="8" />
                <rect x="30" y="45" width="10" height="10" />
                <rect x="50" y="40" width="6" height="6" />
                <rect x="60" y="55" width="15" height="8" />
                <rect x="80" y="45" width="12" height="12" />
                <rect x="25" y="65" width="15" height="15" />
                <rect x="55" y="80" width="15" height="5" />
                <rect x="80" y="80" width="10" height="10" />
                
                <rect x="45" y="45" width="10" height="10" fill="#1a8c75" /> {/* Logo center dot */}
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#0d4f43]/70">
              {lang === 'en' ? 'Storefront URL' : 'URL ng iyong Tindahan'}
            </div>
            <div className="text-lg font-bold text-[#1a8c75] select-all underline">
              takda.ph/b/marios-barbershop
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full justify-center">
            <button className="px-5 py-2.5 bg-[#1a8c75] text-[#f7fafa] text-sm font-semibold rounded-lg hover:bg-[#0d4f43] transition flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {lang === 'en' ? 'Print Poster' : 'I-print ang Poster'}
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-[#e3f5f0]/40 p-6 rounded-[10px] border border-[#a8ddd4]/30 space-y-4 text-left h-fit">
          <h3 className="font-bold text-[#0d4f43] text-lg">
            {lang === 'en' ? 'Tips for Store Owners' : 'Mga Tip para sa May-ari'}
          </h3>
          <ul className="space-y-3 text-sm text-[#0d4f43]/85 list-disc pl-5">
            <li>
              {lang === 'en'
                ? 'Place the QR code at eye level near the entrance or counter.'
                : 'Ilagay ang QR code sa tapat ng mata malapit sa pintuan o counter.'}
            </li>
            <li>
              {lang === 'en'
                ? 'Inform customers that booking does not require downloading any app.'
                : 'Sabihin sa mga customer na hindi kailangan mag-download ng app para mag-book.'}
            </li>
            <li>
              {lang === 'en'
                ? 'Tell customers to expect an SMS reminder 15 minutes before their slot.'
                : 'Sabihin sa customer na maghintay ng SMS reminder 15 minuto bago ang kanilang oras.'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
