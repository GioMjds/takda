import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default async function SettingsPage({
  params
}: PageProps<'/[lang]/dashboard/settings'>) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
          {dict.dashboard.tabs.settings}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {lang === 'en'
            ? 'Manage your storefront profile, contact information, and SMS notification preferences.'
            : 'Pamahalaan ang profile ng iyong tindahan, impormasyon sa pakikipag-ugnay, at kagustuhan sa SMS notification.'}
        </p>
      </div>

      {/* Settings Form Card */}
      <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm max-w-2xl">
        <form className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-[#0d4f43] text-lg border-b border-[#a8ddd4]/25 pb-2">
              {lang === 'en' ? 'Store Profile' : 'Profile ng Tindahan'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Biz Name */}
              <div>
                <label
                  htmlFor="bizName"
                  className="block text-sm font-semibold text-[#0d4f43]"
                >
                  {dict.onboarding.businessName}
                </label>
                <input
                  id="bizName"
                  name="bizName"
                  type="text"
                  defaultValue="Mario's Barbershop"
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label
                  htmlFor="bizPhone"
                  className="block text-sm font-semibold text-[#0d4f43]"
                >
                  {dict.onboarding.phone}
                </label>
                <input
                  id="bizPhone"
                  name="bizPhone"
                  type="tel"
                  defaultValue="09171234567"
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
                />
              </div>

              {/* Biz Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="bizAddress"
                  className="block text-sm font-semibold text-[#0d4f43]"
                >
                  {lang === 'en' ? 'Storefront Address' : 'Address ng Tindahan'}
                </label>
                <input
                  id="bizAddress"
                  name="bizAddress"
                  type="text"
                  defaultValue="Stall #3, Pasig Public Market, Pasig City"
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-[#0d4f43] text-lg border-b border-[#a8ddd4]/25 pb-2">
              {lang === 'en'
                ? 'SMS Notification Preferences'
                : 'Mga Kagustuhan sa SMS Notification'}
            </h3>

            <div className="space-y-4">
              {/* Toggle SMS */}
              <div className="flex items-start gap-3">
                <input
                  id="enableSms"
                  name="enableSms"
                  type="checkbox"
                  defaultChecked
                  className="mt-1 h-4.5 w-4.5 text-[#1a8c75] border-[#a8ddd4] rounded focus:ring-[#1a8c75]"
                />
                <div>
                  <label
                    htmlFor="enableSms"
                    className="text-sm font-bold text-[#0d4f43]"
                  >
                    {lang === 'en'
                      ? 'Enable Automatic Reminders'
                      : 'I-enable ang Awtomatikong Reminders'}
                  </label>
                  <p className="text-xs text-[#0d4f43]/70 font-medium">
                    {lang === 'en'
                      ? 'Customers will receive a SMS reminder before their scheduled slot.'
                      : 'Makakatanggap ng SMS reminder ang mga customer bago ang kanilang naka-schedule na oras.'}
                  </p>
                </div>
              </div>

              {/* Time buffer select */}
              <div>
                <label
                  htmlFor="smsBuffer"
                  className="block text-sm font-semibold text-[#0d4f43]"
                >
                  {lang === 'en'
                    ? 'Send Reminder Buffer'
                    : 'Oras Bago Ipadala ang Reminder'}
                </label>
                <select
                  id="smsBuffer"
                  name="smsBuffer"
                  defaultValue="15"
                  className="mt-1 block w-full md:w-1/2 px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
                >
                  <option value="5">
                    5 {lang === 'en' ? 'minutes before' : 'minuto bago'}
                  </option>
                  <option value="10">
                    10 {lang === 'en' ? 'minutes before' : 'minuto bago'}
                  </option>
                  <option value="15">
                    15 {lang === 'en' ? 'minutes before' : 'minuto bago'}
                  </option>
                  <option value="30">
                    30 {lang === 'en' ? 'minutes before' : 'minuto bago'}
                  </option>
                </select>
              </div>

              {/* Template field */}
              <div>
                <label
                  htmlFor="smsTemplate"
                  className="block text-sm font-semibold text-[#0d4f43]"
                >
                  {lang === 'en'
                    ? 'SMS Message Template'
                    : 'Template ng Mensahe sa SMS'}
                </label>
                <textarea
                  id="smsTemplate"
                  name="smsTemplate"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
                  defaultValue={
                    lang === 'en'
                      ? "Hi {name}! Your slot at Mario's Barbershop is coming up at {time}. Position #5 in line."
                      : "Hi {name}! Papalapit na ang iyong oras sa Mario's Barbershop sa ganap na {time}. Pang-5 ka sa pila."
                  }
                />
              </div>
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
