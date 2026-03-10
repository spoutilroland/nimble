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
import { deleteFromBlob } from '@/lib/storage';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');
const dataDir = path.join(process.cwd(), 'data');

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { mediaIds } = await req.json();

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ error: 'mediaIds requis' }, { status: 400 });
    }

    pushUndo('Suppression groupée media', {
      'media.json': path.join(dataDir, 'media.json'),
      'carousels.json': path.join(dataDir, 'carousels.json'),
    });

    const mediaData = await readMediaRegistry();
    const carouselsData = await readCarouselsConfig();
    let deleted = 0;

    for (const mediaId of mediaIds) {
      const entry = mediaData.media[mediaId];
      if (!entry) continue;

      // Retirer des carrousels
      for (const carousel of Object.values(carouselsData.carousels)) {
        carousel.images = (carousel.images || []).filter((id) => id !== mediaId);
      }

      // Supprimer les fichiers
      await fsp.unlink(path.join(mediaDir, entry.filename)).catch(() => {});
      await deleteFromBlob(`uploads/media/${entry.filename}`).catch(() => {});
      if (entry.hasWebp) {
        const webpName = entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
        await fsp.unlink(path.join(mediaDir, webpName)).catch(() => {});
        await deleteFromBlob(`uploads/media/${webpName}`).catch(() => {});
      }

      delete mediaData.media[mediaId];
      deleted++;
    }

    await writeCarouselsConfig(carouselsData);
    await writeMediaRegistry(mediaData);

    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 });
  }
});
