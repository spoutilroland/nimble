export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import {
  readCarouselsConfig, readMediaRegistry, getMediaUrls,
  readPagesConfig, readLayoutsConfig,
} from '@/lib/data';

export const GET = withAuth(async () => {
  try {
    const carouselsData = readCarouselsConfig();
    const mediaData = readMediaRegistry();
    const pagesData = readPagesConfig();
    const layoutsData = readLayoutsConfig();

    const allImages: Record<string, unknown> = {};

    for (const [key, carousel] of Object.entries(carouselsData.carousels)) {
      let title = carousel.title;
      if (title === key) {
        for (const page of pagesData.pages || []) {
          for (const section of page.sections || []) {
            if (!section.blockCarousels) continue;
            for (const [blockId, bcId] of Object.entries(section.blockCarousels)) {
              if (bcId !== key) continue;
              const layout = layoutsData.layouts?.[section.layoutId!];
              const block = layout?.blocks?.find((b) => b.blockId === blockId);
              const blockType = block ? (block.type === 'image' ? 'Image' : 'Carrousel') : 'Media';
              const layoutLabel = layout ? layout.label : section.layoutId || key;
              title = `${layoutLabel} — ${blockType} (${section.carouselId || key})`;
            }
          }
        }
      }

      const images = (carousel.images || [])
        .filter((mediaId) => mediaData.media[mediaId])
        .map((mediaId) => getMediaUrls(mediaData.media[mediaId]));

      allImages[key] = {
        carousel: { id: carousel.id, title, maxImages: carousel.maxImages },
        images,
      };
    }

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
});
