import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { SiteConfig } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';
import { getDataDir } from '@/lib/paths';

const siteFile = path.join(getDataDir(), 'site.json');

const defaultSiteConfig: SiteConfig = {
  business: {
    name: 'My Website',
    tagline: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    hours: { weekdays: '', saturday: '', note: '' },
    legal: { siret: '', certifications: '', copyright: '' },
  },
  seo: { defaultTitle: '', defaultDescription: '', ogImage: null },
  fonts: { heading: 'Oswald', body: 'Raleway', googleFontsUrl: '' },
  captcha: { provider: '', siteKey: '' },
  design: { borderStyle: 'rounded' },
  logoMode: 'logo-only',
  logoPosition: 'left',
  languages: { available: ['fr'], default: 'fr' },
  social: {
    linkedin: '', facebook: '', instagram: '',
    x: '', tiktok: '', youtube: '', pinterest: '', github: '',
  },
  footer: {
    cols: 3,
    blocks: [
      { blockId: 'f1', type: 'logo-desc', row: 1, col: 1, colSpan: 1 },
      { blockId: 'f2', type: 'contact', row: 1, col: 2, colSpan: 1 },
      { blockId: 'f3', type: 'hours', row: 1, col: 3, colSpan: 1 },
      { blockId: 'f4', type: 'legal', row: 2, col: 1, colSpan: 3 },
    ],
  },
  mail: undefined,
};

export function readSiteConfig(): SiteConfig {
  try {
    return JSON.parse(fs.readFileSync(siteFile, 'utf8'));
  } catch {
    return defaultSiteConfig;
  }
}

export async function writeSiteConfig(data: SiteConfig): Promise<void> {
  await fsp.writeFile(siteFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('site.json', data).catch(() => {});
}
