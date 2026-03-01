export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, writeMediaRegistry, readCarouselsConfig, getMediaUrls } from '@/lib/data';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');

export const GET = withAuth(async () => {
  const mediaData = readMediaRegistry();
  const carouselsData = readCarouselsConfig();
  let dirty = false;

  const items = await Promise.all(
    Object.values(mediaData.media).map(async (entry) => {
      const usedIn = Object.entries(carouselsData.carousels)
        .filter(([, c]) => (c.images || []).includes(entry.id))
        .map(([id, c]) => ({ id, title: c.title }));

      // Cache read-through : enrichir fileSize/width/height si manquants
      if (entry.fileSize == null || entry.width == null || entry.height == null) {
        try {
          const filePath = path.join(mediaDir, entry.filename);
          const stat = await fsp.stat(filePath);
          entry.fileSize = stat.size;

          if (/\.(jpg|jpeg|png|webp)$/i.test(entry.filename)) {
            const meta = await sharp(filePath).metadata();
            entry.width = meta.width ?? 0;
            entry.height = meta.height ?? 0;
          } else {
            entry.width = 0;
            entry.height = 0;
          }
          dirty = true;
        } catch {
          entry.fileSize = entry.fileSize ?? 0;
          entry.width = entry.width ?? 0;
          entry.height = entry.height ?? 0;
        }
      }

      return { ...entry, ...getMediaUrls(entry), usedIn };
    })
  );

  // Persister les métadonnées enrichies
  if (dirty) {
    await writeMediaRegistry(mediaData);
  }

  return NextResponse.json({ media: items });
});
