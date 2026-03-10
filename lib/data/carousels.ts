import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { CarouselsConfig, CarouselEntry } from '@/lib/types';
import type { PagesConfig } from '@/lib/types';
import type { MediaUrls } from '@/lib/types';
import { readMediaRegistry, getMediaUrls } from './media';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const carouselsFile = path.join(process.cwd(), 'data', 'carousels.json');

export async function readCarouselsConfig(): Promise<CarouselsConfig> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<CarouselsConfig>('carousels.json', { carousels: {} });
  }
  try {
    return JSON.parse(fs.readFileSync(carouselsFile, 'utf8'));
  } catch {
    return { carousels: {} };
  }
}

export async function writeCarouselsConfig(data: CarouselsConfig): Promise<void> {
  await fsp.writeFile(carouselsFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('carousels.json', data).catch(() => {});
}

export async function getCarouselImages(carouselId: string): Promise<MediaUrls[]> {
  const carouselsData = await readCarouselsConfig();
  const mediaData = await readMediaRegistry();
  const carousel = carouselsData.carousels[carouselId];
  if (!carousel) return [];
  return (carousel.images || [])
    .filter((mediaId) => mediaData.media[mediaId])
    .map((mediaId) => getMediaUrls(mediaData.media[mediaId]));
}

export async function ensureCarouselExists(
  carouselId: string,
  title?: string,
  maxImages?: number
): Promise<CarouselEntry> {
  const data = await readCarouselsConfig();
  if (!data.carousels[carouselId]) {
    data.carousels[carouselId] = {
      id: carouselId,
      title: title || carouselId,
      maxImages: maxImages ?? 20,
      images: [],
    };
    await writeCarouselsConfig(data);
  } else if (maxImages !== undefined && data.carousels[carouselId].maxImages !== maxImages) {
    data.carousels[carouselId].maxImages = maxImages;
    await writeCarouselsConfig(data);
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
  const carouselsData = await readCarouselsConfig();

  // Supprimer uniquement les entrées carousel non référencées par aucune page
  // Les media ne sont JAMAIS supprimés ici — c'est la médiathèque qui gère ça
  let dirty = false;
  for (const id of Object.keys(carouselsData.carousels)) {
    if (!activeIds.has(id)) {
      delete carouselsData.carousels[id];
      dirty = true;
    }
  }

  if (dirty) {
    await writeCarouselsConfig(carouselsData);
  }
}
