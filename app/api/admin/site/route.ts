export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { isDemoMode } from '@/lib/demo';
import { readSiteConfig, writeSiteConfig } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { getDataDir } from '@/lib/paths';

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const siteFile = path.join(getDataDir(), 'site.json');
    pushUndo('Identité du site', { 'site.json': siteFile });
    const body = await req.json();

    // En mode demo, ignorer les champs sensibles (captcha, mail password)
    if (isDemoMode()) {
      const current = readSiteConfig();
      delete body.captcha;
      if (body.mail) body.mail.pass = current.mail?.pass ?? '';
    }

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
