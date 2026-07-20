'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@takda/shared';
import { loginApi } from '../api/_POST';

export function useLoginForm(lang: string) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(
      loginSchema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<LoginInput>,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);
    try {
      const result = await loginApi(data);
      if (result.success) {
        router.push(`/${lang}/dashboard`);
      } else {
        setApiError(result.error || 'Incorrect email or password. Try again.');
      }
    } catch {
      setApiError(
        "Can't reach the server. Check your connection and try again.",
      );
    }
  };

  return {
    form,
    register: form.register,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit(onSubmit),
    apiError,
    isSubmitting: form.formState.isSubmitting,
  };
}

export default function HookDummy() {
  return null;
}
