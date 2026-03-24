import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo';
import { restoreDemoSnapshot } from '@/lib/demo-reset';

export const runtime = 'nodejs';

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Not in demo mode' }, { status: 403 });
  }

  const ok = restoreDemoSnapshot();
  if (ok) {
    return NextResponse.json({ success: true, message: 'Demo réinitialisée' });
  }
  return NextResponse.json({ error: 'Snapshot introuvable' }, { status: 500 });
}
