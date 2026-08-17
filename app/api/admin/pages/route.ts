export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { writePagesConfig, ensureCarouselExists, cleanOrphanedCarousels, readLayoutsConfig, readContent, writeContent } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { getSectionFields } from '@/lib/sidebar/section-fields';
import { isDemoMode, readDemoConfig } from '@/lib/demo';
import type { SectionType } from '@/lib/types/pages';
import { getDataDir } from '@/lib/paths';

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const siteFile = getDataDir();
    pushUndo('Pages et sections', {
      'pages.json': path.join(siteFile, 'pages.json'),
      'carousels.json': path.join(siteFile, 'carousels.json'),
      'media.json': path.join(siteFile, 'media.json'),
    });

    const body = await req.json();

    // Limites demo
    if (isDemoMode()) {
      const { limits } = readDemoConfig();
      const pages = body.pages || [];
      if (pages.length > limits.maxPages) {
        return NextResponse.json(
          { error: `Mode demo : maximum ${limits.maxPages} pages` },
          { status: 403 }
        );
      }
      for (const page of pages) {
        const sections = page.sections || [];
        if (sections.length > limits.maxSectionsPerPage) {
          return NextResponse.json(
            { error: `Mode demo : maximum ${limits.maxSectionsPerPage} sections par page` },
            { status: 403 }
          );
        }
      }
      const customCount = pages.reduce((acc: number, p: { sections?: { type: string }[] }) =>
        acc + (p.sections || []).filter((s: { type: string }) => s.type === 'custom-layout').length, 0
      );
      if (customCount > limits.maxCustomSections) {
        return NextResponse.json(
          { error: `Mode demo : maximum ${limits.maxCustomSections} sections personnalisées` },
          { status: 403 }
        );
      }
    }

    // Sanitize des slugs : pas d'espaces, pas de caracteres speciaux
    for (const page of body.pages || []) {
      if (page.slug && page.slug !== '/') {
        page.slug = '/' + page.slug
          .replace(/^\/+/, '')
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-/]/g, '-')
          .replace(/-{2,}/g, '-')
          .replace(/-$/g, '');
      }
    }

    // Auto-generer contentId pour chaque section qui n'en a pas + migrer le contenu
    const content = readContent();
    let contentChanged = false;
    for (const page of body.pages || []) {
      const pageId = (page.slug || '/').replace(/^\//, '') || 'index';
      for (const section of page.sections || []) {
        if (!section.contentId) {
          const newId = Math.random().toString(36).slice(2, 8);
          section.contentId = newId;
          // Migrer les anciennes cles de contenu vers les nouvelles (prefixees)
          const def = getSectionFields(section.type as SectionType);
          const oldKeys = def.fields.map((f) => f.key);
          // Pour custom-layout, les cles sont dynamiques
          if (section.type === 'custom-layout' && section.layoutId) {
            // On ne peut pas connaitre les blockIds ici facilement, skip migration
          }
          for (const lang of Object.keys(content)) {
            const pageContent = content[lang]?.[pageId];
            if (!pageContent) continue;
            for (const oldKey of oldKeys) {
              if (pageContent[oldKey] !== undefined && pageContent[`${newId}--${oldKey}`] === undefined) {
                pageContent[`${newId}--${oldKey}`] = pageContent[oldKey];
                contentChanged = true;
              }
            }
          }
        }
      }
    }
    if (contentChanged) await writeContent(content);

    await writePagesConfig(body);

    // Créer les carousels manquants avec le bon maxImages selon le type de bloc
    const layoutsData = readLayoutsConfig();
    for (const page of body.pages || []) {
      for (const section of page.sections || []) {
        if (section.carouselId && !section.blockCarousels) {
          ensureCarouselExists(section.carouselId, `${page.title} — ${section.type}`);
        }
        if (section.blockCarousels && section.layoutId) {
          const layout = layoutsData.layouts?.[section.layoutId];
          for (const [blockId, carouselId] of Object.entries(section.blockCarousels as Record<string, string>)) {
            if (!carouselId) continue;
            const block = layout?.blocks?.find((b: { blockId: string; type: string }) => b.blockId === blockId);
            const maxImages = block?.type === 'image' ? 1 : 20;
            ensureCarouselExists(carouselId, carouselId, maxImages);
          }
        }
      }
    }

    // Supprimer les carousels et media orphelins
    cleanOrphanedCarousels(body).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
});
