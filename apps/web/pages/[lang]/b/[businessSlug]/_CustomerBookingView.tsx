'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { Business, Service, Slot } from '@takda/shared';
import BusinessHeader from './sections/_BusinessHeader';
import ServiceSelector from './sections/_ServiceSelector';
import SlotGrid from './sections/_SlotGrid';
import BookingForm from './sections/_BookingForm';
import ConfirmationCard from './sections/_ConfirmationCard';
import { useBookingForm } from './hooks/_useBookingForm';

export interface CustomerBookingViewProps {
  business: Business;
  services: Service[];
  slots: Slot[];
  lang: string;
  dict: Record<string, any>;
}

export default function CustomerBookingView({
  business,
  services = [],
  slots = [],
  lang = 'tl',
  dict,
}: Partial<CustomerBookingViewProps>) {
  // Service selection state (default to first active service if any)
  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    const active = services.find((s) => s.isActive);
    return active ? active.id : '';
  });

  // Filter slots for the selected service
  const [selectedSlotStart, setSelectedSlotStart] = useState('');

  // Form logic hook
  const {
    form,
    isLoading,
    error,
    successData,
    onSubmit,
    resetForm,
  } = useBookingForm(selectedServiceId, selectedSlotStart, business?.slug, lang);

  if (!business || !dict) {
    return null;
  }

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    setSelectedSlotStart(''); // reset slot selection when service changes
  };

  const handleBookingReset = () => {
    resetForm();
    setSelectedSlotStart('');
  };


  return (
    <div className="space-y-6">
      {/* 1. Business Header (above-the-fold) */}
      <BusinessHeader
        name={business.name}
        category={business.slug.includes('barber') ? (lang === 'en' ? 'Barbershop' : 'Gupitan') : (lang === 'en' ? 'Service Stall' : 'Stall')}
        isOpen={business.isActive}
        isFull={slots.every((s) => !s.isAvailable)}
        address={business.address}
        phone={business.phone}
        lang={lang}
      />

      {successData ? (
        /* 5. Confirmation State */
        <ConfirmationCard
          booking={successData.booking}
          businessName={business.name}
          businessAddress={business.address}
          lang={lang}
          onReset={handleBookingReset}
        />
      ) : (
        <div className="space-y-6">
          {/* 2. Service Selector */}
          <ServiceSelector
            services={services}
            selectedServiceId={selectedServiceId}
            onSelect={handleServiceSelect}
            lang={lang}
          />

          {/* 3. Slot Grid & 4. Booking Form */}
          <div className="bg-white p-5 rounded-2xl border border-[#a8ddd4]/40 space-y-6 shadow-[0_4px_12px_rgba(26,140,117,0.02)]">
            <SlotGrid
              slots={slots}
              selectedSlotStart={selectedSlotStart}
              onSelect={setSelectedSlotStart}
              lang={lang}
            />

            <hr className="border-[#a8ddd4]/20" />

            <FormProvider {...form}>
              <BookingForm
                isLoading={isLoading}
                error={error}
                onSubmit={onSubmit}
                lang={lang}
                submitLabel={
                  selectedSlotStart
                    ? dict.booking.submit
                    : lang === 'en'
                      ? 'Select an Available Time'
                      : 'Pumili muna ng Oras'
                }
              />
            </FormProvider>
          </div>
        </div>
      )}
    </div>
  );
}
