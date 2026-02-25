export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { writePagesConfig, extractCarouselIds, ensureCarouselExists, cleanOrphanedCarousels } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const siteFile = path.join(process.cwd(), 'data');
    pushUndo('Pages et sections', {
      'pages.json': path.join(siteFile, 'pages.json'),
      'carousels.json': path.join(siteFile, 'carousels.json'),
      'media.json': path.join(siteFile, 'media.json'),
    });

    const body = await req.json();
    await writePagesConfig(body);

    // Créer les carousels manquants
    extractCarouselIds(body).forEach((id) => ensureCarouselExists(id));

    // Supprimer les carousels et media orphelins
    cleanOrphanedCarousels(body).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
});
