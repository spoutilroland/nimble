export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import {
  readCarouselsConfig, writeCarouselsConfig,
  readMediaRegistry, getMediaUrls,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const POST = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { carouselId } = await ctx!.params;
  const { mediaId } = await req.json();

  if (!mediaId || typeof mediaId !== 'string') {
    return NextResponse.json({ error: 'mediaId requis' }, { status: 400 });
  }

  const carouselsData = await readCarouselsConfig();
  const carousel = carouselsData.carousels[carouselId];

  if (!carousel) {
    return NextResponse.json({ error: 'Carousel introuvable' }, { status: 404 });
  }

  const mediaData = await readMediaRegistry();
  const mediaEntry = mediaData.media[mediaId];

  if (!mediaEntry) {
    return NextResponse.json({ error: 'Média introuvable' }, { status: 404 });
  }

  if ((carousel.images || []).length >= carousel.maxImages) {
    return NextResponse.json(
      { error: `Limite de ${carousel.maxImages} images atteinte` },
      { status: 400 }
    );
  }

  if (!carousel.images) carousel.images = [];
  if (carousel.images.includes(mediaId)) {
    return NextResponse.json({ error: 'Image déjà présente dans ce carousel' }, { status: 400 });
  }

  try {
    pushUndo('Ajout média', {
      'carousels.json': path.join(process.cwd(), 'data', 'carousels.json'),
    });

    carousel.images.push(mediaId);
    await writeCarouselsConfig(carouselsData);

    const urls = getMediaUrls(mediaEntry);
    return NextResponse.json({ success: true, filename: urls.filename, url: urls.url });
  } catch {
    return NextResponse.json({ error: 'Ajout échoué' }, { status: 500 });
  }
});
