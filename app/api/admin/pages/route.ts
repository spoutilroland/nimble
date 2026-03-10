export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { writePagesConfig, ensureCarouselExists, cleanOrphanedCarousels, readLayoutsConfig } from '@/lib/data';
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

    // Créer les carousels manquants avec le bon maxImages selon le type de bloc
    const layoutsData = await readLayoutsConfig();
    for (const page of body.pages || []) {
      for (const section of page.sections || []) {
        if (section.carouselId && !section.blockCarousels) {
          await ensureCarouselExists(section.carouselId, `${page.title} — ${section.type}`);
        }
        if (section.blockCarousels && section.layoutId) {
          const layout = layoutsData.layouts?.[section.layoutId];
          for (const [blockId, carouselId] of Object.entries(section.blockCarousels as Record<string, string>)) {
            if (!carouselId) continue;
            const block = layout?.blocks?.find((b: { blockId: string; type: string }) => b.blockId === blockId);
            const maxImages = block?.type === 'image' ? 1 : 20;
            await ensureCarouselExists(carouselId, carouselId, maxImages);
          }
        }
      }
    }

    // Supprimer les carousels et media orphelins
    cleanOrphanedCarousels(body).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
});
