export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts, please try again later.' },
      { status: 429 }
    );
  }

  const { username, password } = await req.json();
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (username !== adminUsername) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isValid = await verifyPassword(password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = await getSession();
  session.user = username;
  session.isLoggedIn = true;
  await session.save();

  const res = NextResponse.json({ success: true });
  // Cookie non-httpOnly pour que le JS (ContentEditor) détecte la session admin
  res.cookies.set('is_admin', '1', {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  return res;
}
