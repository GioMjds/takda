import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { http, ApiError } from '@/configs/fetch';
import { loginSchema } from '@takda/shared';

interface NestLoginResponse {
  user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    let accessToken = '';
    let refreshToken = '';
    let user = null;

    try {
      const response = await http.post<NestLoginResponse>('/v1/auth/login', validated);
      accessToken = response.tokens.accessToken;
      refreshToken = response.tokens.refreshToken;
      user = response.user;
    } catch (apiErr) {
      if (
        process.env.NODE_ENV !== 'production' &&
        apiErr instanceof ApiError &&
        (apiErr.status === 0 || apiErr.status === 404)
      ) {
        const mockRole = validated.email.includes('staff')
          ? 'STAFF'
          : validated.email.includes('admin')
            ? 'ADMIN'
            : 'OWNER';
        accessToken = `dev_token_${Buffer.from(
          JSON.stringify({ email: validated.email, role: mockRole }),
        ).toString('base64url')}`;
      } else {
        throw apiErr;
      }
    }

    // Store JWT / auth tokens in httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (refreshToken) {
      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({ success: true, user });
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
