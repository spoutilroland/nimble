import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { PagesConfig } from '@/lib/types';

const pagesFile = path.join(process.cwd(), 'data', 'pages.json');

export function readPagesConfig(): PagesConfig {
  try {
    return JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
  } catch {
    return { pages: [] };
  }
}

export async function writePagesConfig(data: PagesConfig): Promise<void> {
  await fsp.writeFile(pagesFile, JSON.stringify(data, null, 2));
}
