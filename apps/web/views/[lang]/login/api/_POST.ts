import type { LoginInput } from '@takda/shared';

/**
 * Client-side helper to post credentials to the Next.js BFF login API route.
 */
export async function loginApi(data: LoginInput): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    return body;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to the authentication server.',
    };
  }
}

// Next.js Pages Router compatibility dummy export
export default function ApiDummy() {
  return null;
}
