export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import {
  readCarouselsConfig, writeCarouselsConfig,
  readMediaRegistry, getMediaUrls,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { getDataDir } from '@/lib/paths';

export const POST = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { carouselId } = await ctx!.params;
  const { sourceCarouselId, filename } = await req.json();

  const carouselsData = readCarouselsConfig();
  const destCarousel = carouselsData.carousels[carouselId];
  const srcCarousel = carouselsData.carousels[sourceCarouselId];

  if (!destCarousel) {
    return NextResponse.json({ error: 'Carousel destination introuvable' }, { status: 404 });
  }
  if (!srcCarousel) {
    return NextResponse.json({ error: 'Carousel source introuvable' }, { status: 404 });
  }

  const safeFilename = path.basename(filename);
  const mediaData = readMediaRegistry();
  const mediaId = Object.keys(mediaData.media).find(
    (id) => mediaData.media[id].filename === safeFilename
  );

  if (!mediaId) {
    return NextResponse.json({ error: 'Image source introuvable' }, { status: 404 });
  }

  if ((destCarousel.images || []).length >= destCarousel.maxImages) {
    return NextResponse.json(
      { error: `Limite de ${destCarousel.maxImages} images atteinte` },
      { status: 400 }
    );
  }

  try {
    pushUndo('Copie image', {
      'carousels.json': path.join(getDataDir(), 'carousels.json'),
    });

    if (!destCarousel.images) destCarousel.images = [];
    if (!destCarousel.images.includes(mediaId)) {
      destCarousel.images.push(mediaId);
    }
    await writeCarouselsConfig(carouselsData);

    const urls = getMediaUrls(mediaData.media[mediaId]);
    return NextResponse.json({ success: true, filename: urls.filename, url: urls.url });
  } catch {
    return NextResponse.json({ error: 'Copie échouée' }, { status: 500 });
  }
});
