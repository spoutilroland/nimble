import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { LayoutsConfig } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';

const layoutsFile = path.join(process.cwd(), 'data', 'layouts.json');

export function readLayoutsConfig(): LayoutsConfig {
  try {
    return JSON.parse(fs.readFileSync(layoutsFile, 'utf8'));
  } catch {
    return { layouts: {} };
  }
}

export async function writeLayoutsConfig(data: LayoutsConfig): Promise<void> {
  await fsp.writeFile(layoutsFile, JSON.stringify(data, null, 2));
  syncJsonToBlob('layouts.json', data).catch(() => {});
}
