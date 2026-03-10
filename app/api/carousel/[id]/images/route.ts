export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readCarouselsConfig, getCarouselImages } from '@/lib/data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: carouselId } = await params;
  const data = readCarouselsConfig();
  const carousel = data.carousels[carouselId];

  if (!carousel && !/^[a-zA-Z0-9_-]{1,100}$/.test(carouselId)) {
    return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
  }

  const images = getCarouselImages(carouselId);
  return NextResponse.json({ carousel: carouselId, images });
}
