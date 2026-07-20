import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();

  // Delete authentication cookies
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  return NextResponse.json({ success: true });
}
