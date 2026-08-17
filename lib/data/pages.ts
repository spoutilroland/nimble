import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { PagesConfig } from '@/lib/types';
import type { SectionType } from '@/lib/types/pages';
import { syncJsonToBlob } from '@/lib/storage';
import { getSectionFields } from '@/lib/sidebar/section-fields';
import { getDataDir } from '@/lib/paths';

const pagesFile = path.join(getDataDir(), 'pages.json');

export function readPagesConfig(): PagesConfig {
  try {
    const config: PagesConfig = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
    // Auto-generer contentId pour les sections qui n'en ont pas (migration transparente)
    let needsWrite = false;
    const newContentIds: { pageId: string; contentId: string; type: string; layoutId?: string }[] = [];
    for (const page of config.pages) {
      const pageId = (page.slug || '/').replace(/^\//, '') || 'index';
      for (const section of page.sections) {
        if (!section.contentId) {
          section.contentId = Math.random().toString(36).slice(2, 8);
          newContentIds.push({ pageId, contentId: section.contentId, type: section.type, layoutId: section.layoutId });
          needsWrite = true;
        }
      }
    }
    if (needsWrite) {
      try { fs.writeFileSync(pagesFile, JSON.stringify(config, null, 2)); } catch { /* ignore */ }
      // Migrer le contenu existant vers les nouvelles cles prefixees
      try {
        const contentFile = path.join(getDataDir(), 'content.json');
        const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
        let contentChanged = false;
        for (const { pageId, contentId, type } of newContentIds) {
          const def = getSectionFields(type as SectionType);
          for (const lang of Object.keys(content)) {
            const pc = content[lang]?.[pageId];
            if (!pc) continue;
            for (const f of def.fields) {
              if (pc[f.key] !== undefined && pc[`${contentId}--${f.key}`] === undefined) {
                pc[`${contentId}--${f.key}`] = pc[f.key];
                contentChanged = true;
              }
            }
          }
        }
        if (contentChanged) fs.writeFileSync(contentFile, JSON.stringify(content, null, 2));
      } catch { /* ignore */ }
    }
    return config;
  } catch {
    return { pages: [] };
  }
}

export async function writePagesConfig(data: PagesConfig): Promise<void> {
  await fsp.writeFile(pagesFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('pages.json', data).catch(() => {});
}
