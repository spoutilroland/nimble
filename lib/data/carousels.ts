import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { CarouselsConfig, CarouselEntry } from '@/lib/types';
import type { PagesConfig } from '@/lib/types';
import type { MediaUrls } from '@/lib/types';
import { readMediaRegistry, writeMediaRegistry, getMediaUrls } from './media';

const carouselsFile = path.join(process.cwd(), 'data', 'carousels.json');

export function readCarouselsConfig(): CarouselsConfig {
  try {
    return JSON.parse(fs.readFileSync(carouselsFile, 'utf8'));
  } catch {
    return { carousels: {} };
  }
}

export async function writeCarouselsConfig(data: CarouselsConfig): Promise<void> {
  await fsp.writeFile(carouselsFile, JSON.stringify(data, null, 2));
}

export function writeCarouselsConfigSync(data: CarouselsConfig): void {
  fs.writeFileSync(carouselsFile, JSON.stringify(data, null, 2));
}

export function getCarouselImages(carouselId: string): MediaUrls[] {
  const carouselsData = readCarouselsConfig();
  const mediaData = readMediaRegistry();
  const carousel = carouselsData.carousels[carouselId];
  if (!carousel) return [];
  return (carousel.images || [])
    .filter((mediaId) => mediaData.media[mediaId])
    .map((mediaId) => getMediaUrls(mediaData.media[mediaId]));
}

export function ensureCarouselExists(
  carouselId: string,
  title?: string,
  maxImages?: number
): CarouselEntry {
  const data = readCarouselsConfig();
  if (!data.carousels[carouselId]) {
    data.carousels[carouselId] = {
      id: carouselId,
      title: title || carouselId,
      maxImages: maxImages || 20,
      images: [],
    };
    writeCarouselsConfigSync(data);
  }
  return data.carousels[carouselId];
}

export function extractCarouselIds(pagesData: PagesConfig): string[] {
  const ids: string[] = [];
  for (const page of pagesData.pages || []) {
    for (const section of page.sections || []) {
      if (section.carouselId && !ids.includes(section.carouselId)) {
        ids.push(section.carouselId);
      }
      if (section.blockCarousels) {
        for (const bcId of Object.values(section.blockCarousels)) {
          if (bcId && !ids.includes(bcId)) ids.push(bcId);
        }
      }
    }
  }
  return ids;
}

export async function cleanOrphanedCarousels(newPagesData: PagesConfig): Promise<void> {
  const activeIds = new Set(extractCarouselIds(newPagesData));
  const carouselsData = readCarouselsConfig();
  const mediaData = readMediaRegistry();

  const orphanCarouselIds: string[] = [];
  for (const id of Object.keys(carouselsData.carousels)) {
    if (!activeIds.has(id)) {
      orphanCarouselIds.push(id);
    }
  }

  for (const id of orphanCarouselIds) {
    delete carouselsData.carousels[id];
  }

  // Identifier les mediaIds encore référencés
  const usedMediaIds = new Set<string>();
  for (const carousel of Object.values(carouselsData.carousels)) {
    for (const mediaId of carousel.images || []) {
      usedMediaIds.add(mediaId);
    }
  }

  // Supprimer les media orphelins
  const mediaDir = path.join(process.cwd(), 'uploads', 'media');
  for (const [mediaId, entry] of Object.entries(mediaData.media)) {
    if (!usedMediaIds.has(mediaId)) {
      const filePath = path.join(mediaDir, entry.filename);
      await fsp.unlink(filePath).catch(() => {});
      if (entry.hasWebp) {
        const webpPath = path.join(mediaDir, entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp');
        await fsp.unlink(webpPath).catch(() => {});
      }
      delete mediaData.media[mediaId];
    }
  }

  await writeCarouselsConfig(carouselsData);
  await writeMediaRegistry(mediaData);
}
