'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@takda/shared';
import { loginApi } from '../api/_POST';

/**
 * Custom hook managing the owner login form state, Zod validation,
 * and routing.
 *
 * Error model:
 * - 401 from the BFF → "Incorrect email or password. Try again."
 *   (per the spec; the API does not disclose which field is wrong)
 * - Network/transport error → "Can't reach the server…"
 * - Anything else → generic message
 *
 * Why a single `apiError` state and not RHF's `setError('root', ...)`:
 * the form's two field errors are RHF-managed; the API error is not
 * tied to a specific field, and putting it on `root` collides with
 * RHF's root-error rendering. A single `apiError` state keeps the
 * surface predictable and avoids double-rendering the same message.
 */
export function useLoginForm(lang: string) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<LoginInput>,
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
        // Redirect to owner dashboard. The BFF already set the
        // httpOnly cookie via Set-Cookie; we just need to navigate.
        router.push(`/${lang}/dashboard`);
      } else {
        // 401: invalid creds. The BFF's error path returns the
        // exact message we want, but we hardcode the copy so
        // a generic API error message doesn't leak into the UI.
        setApiError('Incorrect email or password. Try again.');
      }
    } catch {
      setApiError('Can\'t reach the server. Check your connection and try again.');
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    apiError,
    isSubmitting: form.formState.isSubmitting,
  };
}

// Next.js Pages Router compatibility dummy export
export default function HookDummy() {
  return null;
}
