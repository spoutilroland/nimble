export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readSiteConfig, writeSiteConfig } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const siteFile = path.join(process.cwd(), 'data', 'site.json');
    pushUndo('Identité du site', { 'site.json': siteFile });
    const body = await req.json();

    // Si le front renvoie la valeur sentinelle, conserver le vrai mot de passe existant
    if (body.mail?.pass === '••set••') {
      const current = readSiteConfig();
      body.mail.pass = current.mail?.pass ?? '';
    }

    await writeSiteConfig(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
});
