import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createBookingInputSchema } from '@takda/shared';
import type { CreateBookingInput, QueueTokenResponse } from '@takda/shared';
import { createBooking } from '../api/_POST';

export function useBookingForm(
  serviceId: string,
  slotStart: string,
  businessSlug?: string,
  lang: string = 'tl',
) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<QueueTokenResponse | null>(null);

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingInputSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<CreateBookingInput>,
    defaultValues: {
      serviceId,
      slotStart,
      customerName: '',
      customerPhone: '',
      notes: '',
    },
  });

  // Keep form values in sync when serviceId or slotStart change
  useEffect(() => {
    form.setValue('serviceId', serviceId);
    form.setValue('slotStart', slotStart);
  }, [serviceId, slotStart, form]);

  const onSubmit = async (data: CreateBookingInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idempotency-${Date.now()}`;
      const response = await createBooking(
        businessSlug || '',
        data,
        idempotencyKey,
      );
      setSuccessData(response);
      if (businessSlug && response.booking?.id) {
        const confirmUrl = `/${lang}/b/${businessSlug}/confirm?booking=${response.booking.id}&token=${response.queueToken}&phone=${encodeURIComponent(data.customerPhone)}`;
        router.push(confirmUrl as any);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to submit booking. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    successData,
    onSubmit: form.handleSubmit(onSubmit),
    resetForm: () => {
      form.reset({
        serviceId,
        slotStart,
        customerName: '',
        customerPhone: '',
        notes: '',
      });
      setSuccessData(null);
      setError(null);
    },
  };
}

// Next.js Pages Router compatibility dummy export
export default function HookDummy() {
  return null;
}
