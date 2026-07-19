import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default async function SlotsConfigPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
          {dict.dashboard.tabs.slots}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {lang === 'en'
            ? 'Configure operational hours, capacity limit, and slot duration.'
            : 'I-setup ang oras ng operasyon, limitasyon ng kapasidad, at haba ng bawat slot.'}
        </p>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm max-w-2xl">
        <form className="space-y-6">
          {/* Active Days */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#0d4f43]">
              {lang === 'en' ? 'Operating Days' : 'Mga Araw ng Operasyon'}
            </label>
            <div className="flex flex-wrap gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <button
                  key={day}
                  type="button"
                  className="px-4 py-2 border border-[#a8ddd4] hover:bg-[#e3f5f0]/30 rounded-lg text-xs font-bold text-[#0d4f43] transition"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label
                htmlFor="openingTime"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {lang === 'en' ? 'Opening Time' : 'Oras ng Pagbubukas'}
              </label>
              <input
                id="openingTime"
                name="openingTime"
                type="time"
                defaultValue="08:00"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>

            {/* End Time */}
            <div>
              <label
                htmlFor="closingTime"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {lang === 'en' ? 'Closing Time' : 'Oras ng Pagsasara'}
              </label>
              <input
                id="closingTime"
                name="closingTime"
                type="time"
                defaultValue="17:00"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>

            {/* Slot Duration */}
            <div>
              <label
                htmlFor="slotDuration"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {lang === 'en' ? 'Slot Duration' : 'Haba ng Bawat Slot'}
              </label>
              <select
                id="slotDuration"
                name="slotDuration"
                defaultValue="15"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              >
                <option value="5">5 {lang === 'en' ? 'mins' : 'minuto'}</option>
                <option value="10">10 {lang === 'en' ? 'mins' : 'minuto'}</option>
                <option value="15">15 {lang === 'en' ? 'mins' : 'minuto'}</option>
                <option value="30">30 {lang === 'en' ? 'mins' : 'minuto'}</option>
                <option value="60">1 {lang === 'en' ? 'hour' : 'oras'}</option>
              </select>
            </div>

            {/* Capacity Limit */}
            <div>
              <label
                htmlFor="capacityLimit"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {lang === 'en' ? 'Capacity Per Slot' : 'Kapasidad Kada Slot'}
              </label>
              <input
                id="capacityLimit"
                name="capacityLimit"
                type="number"
                min="1"
                defaultValue="1"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-[#a8ddd4]/30 rounded-lg text-sm font-semibold text-[#0d4f43] bg-white hover:bg-gray-50 transition"
            >
              {dict.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] transition"
            >
              {dict.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
