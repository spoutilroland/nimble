import { NextResponse } from 'next/server';
import { isDemoMode, readDemoConfig } from '@/lib/demo';
import { createDemoSnapshot, startAutoResetTimer } from '@/lib/demo-reset';

export const runtime = 'nodejs';

let initialized = false;

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ demo: false });
  }

  // Initialisation au premier appel : créer le snapshot + démarrer l'auto-reset
  if (!initialized) {
    initialized = true;
    const config = readDemoConfig();
    createDemoSnapshot();
    startAutoResetTimer(config.resetInactivityMinutes);
  }

  const config = readDemoConfig();
  return NextResponse.json({ demo: true, ...config });
}
