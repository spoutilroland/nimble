export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readSiteConfig } from '@/lib/data';

export async function GET() {
  const config = readSiteConfig();
  // Ne jamais exposer le mot de passe SMTP publiquement
  if (config.mail?.pass) {
    config.mail = { ...config.mail, pass: '••set••' };
  }
  return NextResponse.json(config);
}
