export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readSiteConfig } from '@/lib/data';

export async function POST(req: NextRequest) {
  const { lang } = await req.json();
  const site = readSiteConfig();
  const available = site.languages?.available || ['fr'];

  if (!available.includes(lang)) {
    return NextResponse.json({ error: 'Langue non disponible' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('lang', lang, {
    httpOnly: false,
    sameSite: 'strict',
    maxAge: 365 * 24 * 3600,
  });
  return response;
}
