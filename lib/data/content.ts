import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { ContentData } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';

const contentFile = path.join(process.cwd(), 'data', 'content.json');

export function readContent(): ContentData {
  try {
    return JSON.parse(fs.readFileSync(contentFile, 'utf8'));
  } catch {
    return {};
  }
}

export async function writeContent(data: ContentData): Promise<void> {
  await fsp.writeFile(contentFile, JSON.stringify(data, null, 2));
  syncJsonToBlob('content.json', data).catch(() => {});
}
