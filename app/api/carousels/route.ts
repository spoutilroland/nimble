export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readCarouselsConfig } from '@/lib/data';

export async function GET() {
  const data = await readCarouselsConfig();
  const carouselsInfo: Record<string, { id: string; title: string; maxImages: number }> = {};
  for (const [key, carousel] of Object.entries(data.carousels)) {
    carouselsInfo[key] = {
      id: carousel.id,
      title: carousel.title,
      maxImages: carousel.maxImages,
    };
  }
  return NextResponse.json(carouselsInfo);
}
