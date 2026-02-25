import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { MediaRegistry, MediaEntry, MediaUrls } from '@/lib/types';

const mediaFile = path.join(process.cwd(), 'data', 'media.json');

export function readMediaRegistry(): MediaRegistry {
  try {
    return JSON.parse(fs.readFileSync(mediaFile, 'utf8'));
  } catch {
    return { media: {} };
  }
}

export async function writeMediaRegistry(data: MediaRegistry): Promise<void> {
  await fsp.writeFile(mediaFile, JSON.stringify(data, null, 2));
}

export function writeMediaRegistrySync(data: MediaRegistry): void {
  fs.writeFileSync(mediaFile, JSON.stringify(data, null, 2));
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
