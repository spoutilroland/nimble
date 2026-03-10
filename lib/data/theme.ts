import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { ThemeConfig } from '@/lib/types';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const themeFile = path.join(process.cwd(), 'data', 'theme.json');

export async function readThemeFile(): Promise<ThemeConfig> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<ThemeConfig>('theme.json', { theme: 'default', customThemes: {} });
  }
  try {
    return JSON.parse(fs.readFileSync(themeFile, 'utf8'));
  } catch {
    return { theme: 'default', customThemes: {} };
  }
}

export async function writeThemeFile(data: ThemeConfig): Promise<void> {
  await fsp.writeFile(themeFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('theme.json', data).catch(() => {});
}
