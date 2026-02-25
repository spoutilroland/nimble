export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth } from '@/lib/auth';
import {
  readMediaRegistry, writeMediaRegistry,
  readCarouselsConfig, writeCarouselsConfig,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');
const dataDir = path.join(process.cwd(), 'data');

export const DELETE = withAuth(async (
  _req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { mediaId } = await ctx!.params;
  const mediaData = readMediaRegistry();
  const entry = mediaData.media[mediaId];

  if (!entry) {
    return NextResponse.json({ error: 'Media introuvable' }, { status: 404 });
  }

  try {
    pushUndo('Suppression media', {
      'media.json': path.join(dataDir, 'media.json'),
      'carousels.json': path.join(dataDir, 'carousels.json'),
    });

    const carouselsData = readCarouselsConfig();
    for (const carousel of Object.values(carouselsData.carousels)) {
      carousel.images = (carousel.images || []).filter((id) => id !== mediaId);
    }
    await writeCarouselsConfig(carouselsData);

    await fsp.unlink(path.join(mediaDir, entry.filename)).catch(() => {});
    if (entry.hasWebp) {
      const webpName = entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
      await fsp.unlink(path.join(mediaDir, webpName)).catch(() => {});
    }

    delete mediaData.media[mediaId];
    await writeMediaRegistry(mediaData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 });
  }
});
