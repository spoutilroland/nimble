export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (session.isLoggedIn) {
    return NextResponse.json({ valid: true, user: session.user });
  }
  return NextResponse.json({ valid: false });
}
