import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

// Mock live queue items
const MOCK_QUEUE = [
  {
    id: '1',
    name: 'Juan dela Cruz',
    phone: '09171234567',
    time: '08:00 AM',
    status: 'checked_in',
    position: 1,
  },
  {
    id: '2',
    name: 'Maria Clara',
    phone: '09187654321',
    time: '08:15 AM',
    status: 'confirmed',
    position: 2,
  },
  {
    id: '3',
    name: 'Jose Rizal',
    phone: '09191112222',
    time: '08:30 AM',
    status: 'pending',
    position: 3,
  },
  {
    id: '4',
    name: 'Andres Bonifacio',
    phone: '09203334444',
    time: '08:45 AM',
    status: 'no_show',
    position: 4,
  },
];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="bg-[#e3f5f0] text-[#0d4f43] text-xs font-bold px-2.5 py-1 rounded-full border border-[#a8ddd4]/40">
            {lang === 'en' ? 'Checked In' : 'Naka-check In'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
            {lang === 'en' ? 'Confirmed' : 'Kumpirmado'}
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
            {lang === 'en' ? 'Pending' : 'Naka-pila'}
          </span>
        );
      case 'no_show':
        return (
          <span className="bg-red-50 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
            {lang === 'en' ? 'No Show' : 'Hindi Dumating'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
          {dict.dashboard.title}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {dict.dashboard.subtitle}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'en' ? 'Total Queue' : 'Kabuuang Pila', val: '4', color: 'border-[#a8ddd4]/40' },
          { label: lang === 'en' ? 'Checked In' : 'Naka-check In', val: '1', color: 'border-[#1a8c75]' },
          { label: lang === 'en' ? 'Pending' : 'Naghihintay', val: '2', color: 'border-amber-300' },
          { label: lang === 'en' ? 'No Show' : 'Hindi Dumating', val: '1', color: 'border-red-300' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white p-5 rounded-[10px] border-l-4 ${stat.color} border-y border-r border-[#a8ddd4]/20 shadow-sm`}
          >
            <div className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-3xl font-extrabold text-[#0d4f43] mt-1">
              {stat.val}
            </div>
          </div>
        ))}
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-[10px] border border-[#a8ddd4]/40 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#a8ddd4]/30 flex justify-between items-center bg-[#f7fafa]/50">
          <h2 className="text-lg font-bold text-[#0d4f43]">
            {lang === 'en' ? "Today's Queue List" : 'Listahan ng Pila Ngayong Araw'}
          </h2>
          <span className="text-xs font-semibold text-[#1a8c75] bg-[#e3f5f0] px-3 py-1 rounded-full">
            Live
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {MOCK_QUEUE.map((item) => (
            <div
              key={item.id}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f7fafa]/40 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a8c75]/10 text-[#1a8c75] flex items-center justify-center font-extrabold text-sm border border-[#a8ddd4]/30">
                  #{item.position}
                </div>
                <div>
                  <div className="font-semibold text-[#0d4f43] text-base">
                    {item.name}
                  </div>
                  <div className="text-xs text-[#0d4f43]/75 flex gap-2 mt-0.5 font-medium">
                    <span>{item.phone}</span>
                    <span>•</span>
                    <span className="text-[#1a8c75] font-bold">{item.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(item.status)}
                
                {/* Actions */}
                <div className="flex gap-1.5">
                  {item.status !== 'checked_in' && item.status !== 'no_show' && (
                    <>
                      <button className="px-3 py-1.5 bg-[#1a8c75] text-[#f7fafa] text-xs font-semibold rounded hover:bg-[#0d4f43] transition">
                        {lang === 'en' ? 'Check In' : 'I-check In'}
                      </button>
                      <button className="px-3 py-1.5 border border-red-200 text-red-800 text-xs font-semibold rounded hover:bg-red-50 transition">
                        No Show
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
