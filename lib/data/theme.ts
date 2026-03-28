import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { ThemeConfig } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';
import { getDataDir } from '@/lib/paths';

const themeFile = path.join(getDataDir(), 'theme.json');

export function readThemeFile(): ThemeConfig {
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
