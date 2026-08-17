import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo';
import { touchActivity } from '@/lib/demo-reset';

export const runtime = 'nodejs';

/** Le client appelle cette route périodiquement pour signaler qu'un visiteur est actif */
export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Not in demo mode' }, { status: 403 });
  }

  touchActivity();
  return NextResponse.json({ ok: true });
}
