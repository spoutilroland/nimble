export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { isDemoMode } from '@/lib/demo';

export async function GET(req: NextRequest) {
  // Mode demo : toujours authentifié
  if (isDemoMode()) {
    return NextResponse.json({ valid: true, user: 'demo' });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { limited, retryAfter } = checkRateLimit(ip, { windowMs: 60_000, max: 30 });
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  const session = await getSession();
  const headers = {
    'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
  };
  if (session.isLoggedIn) {
    return NextResponse.json({ valid: true, user: session.user }, { headers });
  }
  return NextResponse.json({ valid: false }, { headers });
}
