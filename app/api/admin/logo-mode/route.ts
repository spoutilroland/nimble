export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readSiteConfig, writeSiteConfig } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { getDataDir } from '@/lib/paths';

export const PUT = withAuth(async (req: NextRequest) => {
  const { mode } = await req.json();
  if (!['logo-only', 'name-only', 'logo-name'].includes(mode)) {
    return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
  }
  try {
    pushUndo('Mode logo', { 'site.json': path.join(getDataDir(), 'site.json') });
    const site = readSiteConfig();
    site.logoMode = mode;
    await writeSiteConfig(site);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
});
