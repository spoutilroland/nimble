import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { LayoutsConfig } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';
import { getDataDir } from '@/lib/paths';

const layoutsFile = path.join(getDataDir(), 'layouts.json');

export function readLayoutsConfig(): LayoutsConfig {
  try {
    return JSON.parse(fs.readFileSync(layoutsFile, 'utf8'));
  } catch {
    return { layouts: {} };
  }
}

export async function writeLayoutsConfig(data: LayoutsConfig): Promise<void> {
  await fsp.writeFile(layoutsFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('layouts.json', data).catch(() => {});
}
