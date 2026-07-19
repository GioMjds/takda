import { notFound } from 'next/navigation';
import { businessSlugSchema } from '@takda/shared';
import type { Business, Service, Slot } from '@takda/shared';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import CustomerBookingView from '@/pages/[lang]/b/[businessSlug]/_CustomerBookingView';
import { http } from '@/configs/fetch';

// Local Mock Data for fallback and preview capability
const MOCK_BUSINESSES: Record<string, { business: Business; services: Service[] }> = {
  'pedros-barbershop': {
    business: {
      id: 'bz-pedro',
      tenantId: 'tn-pilar',
      slug: 'pedros-barbershop',
      name: "Pedro's Barbershop",
      timezone: 'Asia/Manila',
      address: 'Stall 4, Pilar Public Market, Capiz',
      phone: '09171234567',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    services: [
      {
        id: 'sv-gupit',
        businessId: 'bz-pedro',
        slug: 'gupit',
        name: 'Gupit (Haircut)',
        description: 'Standard haircut, includes warm towel.',
        durationMin: 30,
        capacityPerSlot: 1,
        dailyCapacity: 20,
        openTime: '08:00',
        closeTime: '17:00',
        daysOfWeekMask: 127,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sv-shave',
        businessId: 'bz-pedro',
        slug: 'shave-beard',
        name: 'Shave & Beard Trim',
        description: 'Clean shave or line up with straight razor.',
        durationMin: 15,
        capacityPerSlot: 1,
        dailyCapacity: 15,
        openTime: '08:00',
        closeTime: '17:00',
        daysOfWeekMask: 127,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  'lilia-dry-goods': {
    business: {
      id: 'bz-lilia',
      tenantId: 'tn-pilar',
      slug: 'lilia-dry-goods',
      name: "Aling Lilia's Dry Goods",
      timezone: 'Asia/Manila',
      address: 'Stall 12, Dry Goods Section, Pilar Public Market',
      phone: '09987654321',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    services: [
      {
        id: 'sv-pickup',
        businessId: 'bz-lilia',
        slug: 'goods-pickup',
        name: 'Palengke Dry Goods Pickup',
        description: 'Pickup pre-ordered rice, canned goods, and dry supplies.',
        durationMin: 10,
        capacityPerSlot: 2,
        dailyCapacity: 50,
        openTime: '06:00',
        closeTime: '15:00',
        daysOfWeekMask: 127,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
};

function generateSlotsForToday(durationMin: number): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  
  // Set start local to today at 8:00 AM Manila Time (UTC+8) -> 12:00 AM UTC
  const startLocal = new Date(now);
  startLocal.setUTCHours(0, 0, 0, 0);
  
  // End local at 5:00 PM Manila Time -> 9:00 AM UTC
  const endLocal = new Date(startLocal);
  endLocal.setUTCHours(9, 0, 0, 0);

  let current = new Date(startLocal);
  // Ensure we cover future slots
  while (current.getTime() < endLocal.getTime()) {
    const slotStartStr = current.toISOString();
    
    // Seed availability and booked counts for a lively presentation
    const isAvailable = Math.random() > 0.15;
    const bookedCount = isAvailable ? (Math.random() > 0.6 ? 1 : 0) : 1;

    slots.push({
      slotStart: slotStartStr,
      isAvailable,
      capacity: 1,
      bookedCount,
    });

    current = new Date(current.getTime() + durationMin * 60 * 1000);
  }

  return slots;
}

export default async function BookingPage({
  params,
}: PageProps<'/[lang]/b/[businessSlug]'>) {
  const { lang, businessSlug } = await params;

  // Validate businessSlug server-side using Zod
  const validation = businessSlugSchema.safeParse(businessSlug);
  if (!validation.success) {
    notFound();
  }

  const dict = await getDictionary(lang as Locale);

  // Attempt to fetch from backend API, fall back to mock data if backend not ready
  let business: Business;
  let services: Service[] = [];
  let slots: Slot[] = [];

  try {
    const businessData = await http.get<{ business: Business; services: Service[] }>(
      `/businesses/${businessSlug}`
    );
    business = businessData.business;
    services = businessData.services;
  } catch {
    // Backend connection failed or endpoint undefined, use mock
    const mock = MOCK_BUSINESSES[businessSlug];
    if (!mock) {
      // Slug is valid format but not in our mock registry -> trigger 404 Not Found
      notFound();
    }
    business = mock.business;
    services = mock.services;
  }

  // Fetch or generate slots for today
  try {
    slots = await http.get<Slot[]>(`/businesses/${businessSlug}/slots`);
  } catch {
    const duration = services[0]?.durationMin || 15;
    slots = generateSlotsForToday(duration);
  }

  return (
    <CustomerBookingView
      business={business}
      services={services}
      slots={slots}
      lang={lang}
      dict={dict}
    />
  );
}
