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

    // Construire la map des carousels appartenant à un layout custom (groupés)
    const groupMap: Record<string, { key: string; label: string; blockLabel: string }> = {};
    // Construire la map des carousels standalone liés à une section de page
    const standaloneMap: Record<string, string> = {};

    for (const page of pagesData.pages || []) {
      for (const section of page.sections || []) {
        if (section.carouselId && !section.blockCarousels) {
          // Carousel standalone : titre = "Titre page — type section"
          standaloneMap[section.carouselId] = `${page.title} — ${section.type}`;
        }
        if (!section.blockCarousels || !section.carouselId) continue;
        const layout = layoutsData.layouts?.[section.layoutId!];
        const layoutLabel = layout?.label || section.layoutId || section.carouselId;
        const imageBlocks = layout?.blocks?.filter(
          (b) => b.type === 'image' || b.type === 'carousel'
        ) || [];
        imageBlocks.forEach((block, index) => {
          const bcId = section.blockCarousels![block.blockId];
          if (bcId) {
            groupMap[bcId] = {
              key: section.carouselId!,
              label: `${page.title} — ${layoutLabel}`,
              blockLabel: `Image ${index + 1}`,
            };
          }
        });
      }
    }

    const allImages: Record<string, unknown> = {};

    for (const [key, carousel] of Object.entries(carouselsData.carousels)) {
      const group = groupMap[key];
      const title = group ? group.label : (standaloneMap[key] ?? carousel.title);

      const images = (carousel.images || [])
        .filter((mediaId) => mediaData.media[mediaId])
        .map((mediaId) => getMediaUrls(mediaData.media[mediaId]));

      allImages[key] = {
        carousel: { id: carousel.id, title, maxImages: carousel.maxImages },
        images,
        ...(group ? { groupKey: group.key, groupLabel: group.label, blockLabel: group.blockLabel } : {}),
      };
    }

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
});
