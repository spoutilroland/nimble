import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { MediaRegistry, MediaEntry, MediaUrls } from '@/lib/types';
import { appendMediaToBlob, removeMediaFromBlob } from '@/lib/storage';

const mediaFile = path.join(process.cwd(), 'data', 'media.json');
const mediaTmpFile = mediaFile + '.tmp';

export function readMediaRegistry(): MediaRegistry {
  try {
    const raw = fs.readFileSync(mediaFile, 'utf8').trim();
    if (!raw) return { media: {} };
    const parsed = JSON.parse(raw);
    // Protection : ne jamais retourner un objet sans clé "media"
    if (!parsed || typeof parsed.media !== 'object') return { media: {}, folders: {} };
    if (!parsed.folders) parsed.folders = {};
    return parsed;
  } catch {
    return { media: {}, folders: {} };
  }
}

/**
 * Écriture atomique locale UNIQUEMENT (pas de sync Blob).
 * Le Blob est mis à jour via appendMediaToBlob / removeMediaFromBlob.
 */
export async function writeMediaRegistry(data: MediaRegistry): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await fsp.writeFile(mediaTmpFile, json);
  await fsp.rename(mediaTmpFile, mediaFile);
}

export function writeMediaRegistrySync(data: MediaRegistry): void {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(mediaTmpFile, json);
  fs.renameSync(mediaTmpFile, mediaFile);
}

export function generateMediaId(): string {
  return 'm_' + Date.now() + '_' + Math.round(Math.random() * 1e9);
}

export function getMediaUrls(mediaEntry: MediaEntry): MediaUrls {
  const base = mediaEntry.filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return {
    filename: mediaEntry.filename,
    url: '/uploads/media/' + mediaEntry.filename,
    webpUrl: mediaEntry.hasWebp
      ? '/uploads/media/' + base + '.webp'
      : null,
    thumbUrl: mediaEntry.hasThumb
      ? '/uploads/media/' + base + '-thumb.webp'
      : null,
  };
}
