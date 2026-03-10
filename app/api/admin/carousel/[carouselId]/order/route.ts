export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readCarouselsConfig, writeCarouselsConfig, readMediaRegistry } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const POST = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { carouselId } = await ctx!.params;
  const { order } = await req.json();

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array' }, { status: 400 });
  }

  try {
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];
    if (!carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    pushUndo('Ordre images', {
      'carousels.json': path.join(process.cwd(), 'data', 'carousels.json'),
    });

    const mediaData = readMediaRegistry();
    const filenameToId: Record<string, string> = {};
    for (const [id, entry] of Object.entries(mediaData.media)) {
      filenameToId[entry.filename] = id;
    }

    const currentIds = new Set(carousel.images || []);
    const newOrder = (order as string[])
      .map((f) => filenameToId[f])
      .filter((id): id is string => !!id && currentIds.has(id));

    for (const id of carousel.images || []) {
      if (!newOrder.includes(id)) newOrder.push(id);
    }

    carousel.images = newOrder;
    await writeCarouselsConfig(carouselsData);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
});
