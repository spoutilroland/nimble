export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, readCarouselsConfig, getMediaUrls } from '@/lib/data';

export const GET = withAuth(async () => {
  const mediaData = readMediaRegistry();
  const carouselsData = readCarouselsConfig();

  const items = Object.values(mediaData.media).map((entry) => {
    const usedIn = Object.entries(carouselsData.carousels)
      .filter(([, c]) => (c.images || []).includes(entry.id))
      .map(([id, c]) => ({ id, title: c.title }));
    return { ...entry, ...getMediaUrls(entry), usedIn };
  });

  return NextResponse.json({ media: items });
});
