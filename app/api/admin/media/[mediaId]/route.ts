export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth, demoBlock } from '@/lib/auth';
import {
  readMediaRegistry, writeMediaRegistry,
  readCarouselsConfig, writeCarouselsConfig,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { deleteFromBlob, appendMediaToBlob, removeMediaFromBlob } from '@/lib/storage';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');
const dataDir = path.join(process.cwd(), 'data');

// Champs éditables par le client
const EDITABLE_FIELDS = ['altText', 'title', 'tags'] as const;

export const PATCH = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { mediaId } = await ctx!.params;
  const mediaData = readMediaRegistry();
  const entry = mediaData.media[mediaId];

  if (!entry) {
    return NextResponse.json({ error: 'Media introuvable' }, { status: 404 });
  }

  try {
    const body = await req.json();

    pushUndo('Modification media', {
      'media.json': path.join(dataDir, 'media.json'),
    });

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        if (field === 'tags') {
          entry.tags = Array.isArray(body.tags)
            ? body.tags.filter((t: unknown) => typeof t === 'string')
            : [];
        } else {
          (entry as Record<string, unknown>)[field] = typeof body[field] === 'string' ? body[field] : '';
        }
      }
    }

    await writeMediaRegistry(mediaData);
    // Mise à jour atomique de l'entrée sur Blob
    await appendMediaToBlob(mediaId, entry).catch(() => {});
    return NextResponse.json({ success: true, entry });
  } catch {
    return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 });
  }
});

export const DELETE = demoBlock(withAuth(async (
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
    await deleteFromBlob(`uploads/media/${entry.filename}`).catch(() => {});
    if (entry.hasWebp) {
      const webpName = entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
      await fsp.unlink(path.join(mediaDir, webpName)).catch(() => {});
      await deleteFromBlob(`uploads/media/${webpName}`).catch(() => {});
    }

    delete mediaData.media[mediaId];
    await writeMediaRegistry(mediaData);
    // Suppression atomique de l'entrée sur Blob
    await removeMediaFromBlob(mediaId).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 });
  }
}));
