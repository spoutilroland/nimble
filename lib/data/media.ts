import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { MediaRegistry, MediaEntry, MediaUrls } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';

const mediaFile = path.join(process.cwd(), 'data', 'media.json');
const mediaTmpFile = mediaFile + '.tmp';

export function readMediaRegistry(): MediaRegistry {
  try {
    const raw = fs.readFileSync(mediaFile, 'utf8').trim();
    if (!raw) return { media: {} };
    const parsed = JSON.parse(raw);
    // Protection : ne jamais retourner un objet sans clé "media"
    if (!parsed || typeof parsed.media !== 'object') return { media: {} };
    return parsed;
  } catch {
    return { media: {} };
  }
}

/**
 * Écriture atomique : écrit dans un .tmp puis rename.
 * Le rename est atomique sur les systèmes POSIX → pas de fichier vide si crash.
 */
export async function writeMediaRegistry(data: MediaRegistry): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await fsp.writeFile(mediaTmpFile, json);
  await fsp.rename(mediaTmpFile, mediaFile);
  // Ne sync vers Blob que si le registre n'est pas vide
  if (Object.keys(data.media).length > 0) {
    await syncJsonToBlob('media.json', data).catch(() => {});
  }
}

export function writeMediaRegistrySync(data: MediaRegistry): void {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(mediaTmpFile, json);
  fs.renameSync(mediaTmpFile, mediaFile);
  if (Object.keys(data.media).length > 0) {
    syncJsonToBlob('media.json', data).catch(() => {});
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
