import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { PagesConfig } from '@/lib/types';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const pagesFile = path.join(process.cwd(), 'data', 'pages.json');

export async function readPagesConfig(): Promise<PagesConfig> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<PagesConfig>('pages.json', { pages: [] });
  }
  try {
    return JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
  } catch {
    return { pages: [] };
  }
}

export async function writePagesConfig(data: PagesConfig): Promise<void> {
  await fsp.writeFile(pagesFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('pages.json', data).catch(() => {});
}
