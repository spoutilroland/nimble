import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import {
  readCarouselsConfig, writeCarouselsConfig,
  readMediaRegistry,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { getDataDir } from '@/lib/paths';

const dataDir = getDataDir();

export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const { carouselId, filename } = await req.json();
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];

    if (!carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    const safeFilename = path.basename(filename);

    pushUndo('Suppression image', {
      'carousels.json': path.join(dataDir, 'carousels.json'),
      'media.json': path.join(dataDir, 'media.json'),
    });

    const mediaData = readMediaRegistry();
    const mediaId = Object.keys(mediaData.media).find(
      (id) => mediaData.media[id].filename === safeFilename
    );

    if (!mediaId) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    carousel.images = (carousel.images || []).filter((id) => id !== mediaId);
    await writeCarouselsConfig(carouselsData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
});
