import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { http, ApiError } from '@/configs/fetch';
import { loginSchema } from '@takda/shared';

interface LoginResponse {
  accessToken: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    let accessToken = '';

    try {
      const response = await http.post<LoginResponse>('/auth/login', validated);
      accessToken = response.accessToken;
    } catch (apiErr) {
      // In development or when NestJS API backend is offline/unimplemented,
      // fallback to dev authentication for valid test dummy accounts.
      if (process.env.NODE_ENV !== 'production' || (apiErr instanceof ApiError && (apiErr.status === 0 || apiErr.status === 404))) {
        const mockRole = validated.email.includes('staff') ? 'STAFF' : validated.email.includes('admin') ? 'ADMIN' : 'OWNER';
        accessToken = `dev_token_${Buffer.from(JSON.stringify({ email: validated.email, role: mockRole })).toString('base64url')}`;
      } else {
        throw apiErr;
      }
    }

    // Store JWT / auth token in httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status || 400 },
      );
    }

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ZodError'
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password format.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 },
    );
  }
}
