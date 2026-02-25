export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readSiteConfig, writeSiteConfig } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const PUT = withAuth(async (req: NextRequest) => {
  const { position } = await req.json();
  if (!['left', 'right', 'center'].includes(position)) {
    return NextResponse.json({ error: 'Position invalide' }, { status: 400 });
  }
  try {
    pushUndo('Position logo', { 'site.json': path.join(process.cwd(), 'data', 'site.json') });
    const site = readSiteConfig();
    site.logoPosition = position;
    await writeSiteConfig(site);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
});
