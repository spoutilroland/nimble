import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { MediaRegistry, MediaEntry, MediaUrls } from '@/lib/types';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const mediaFile = path.join(process.cwd(), 'data', 'media.json');
const mediaTmpFile = mediaFile + '.tmp';

/**
 * Lit le registre media.
 * - Si Blob activé : fetch directement depuis Vercel Blob (source de vérité unique).
 * - Sinon (dev local) : lecture fichier local.
 */
export async function readMediaRegistry(): Promise<MediaRegistry> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<MediaRegistry>('media.json', { media: {} });
  }

  // Fallback dev local (pas de Blob)
  try {
    const raw = fs.readFileSync(mediaFile, 'utf8').trim();
    if (!raw) return { media: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.media !== 'object') return { media: {} };
    return parsed;
  } catch {
    return { media: {} };
  }
}

/**
 * Écriture du registre media.
 * 1. Put vers Vercel Blob (source de vérité)
 * 2. Écriture locale atomique (cache)
 */
export async function writeMediaRegistry(data: MediaRegistry): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  // Écriture locale (cache pour dev et serving rapide)
  await fsp.writeFile(mediaTmpFile, json);
  await fsp.rename(mediaTmpFile, mediaFile);

  // Sync vers Blob (source de vérité)
  if (Object.keys(data.media).length > 0) {
    await syncJsonToBlob('media.json', data).catch(() => {});
  }
}

export function generateMediaId(): string {
  return 'm_' + Date.now() + '_' + Math.round(Math.random() * 1e9);
}

export function getMediaUrls(mediaEntry: MediaEntry): MediaUrls {
  return {
    filename: mediaEntry.filename,
    url: '/uploads/media/' + mediaEntry.filename,
    webpUrl: mediaEntry.hasWebp
      ? '/uploads/media/' + mediaEntry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp'
      : null,
  };
}
