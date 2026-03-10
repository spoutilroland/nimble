import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { AdminData } from '@/lib/types';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const adminFile = path.join(process.cwd(), 'data', 'admin.json');

export async function readAdminHash(): Promise<string | null> {
  if (isBlobEnabled()) {
    const data = await readJsonFromBlob<AdminData>('admin.json', { passwordHash: '' });
    return data.passwordHash || null;
  }
  try {
    const data: AdminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
    return data.passwordHash || null;
  } catch {
    return null;
  }
}

export async function writeAdminHash(hash: string): Promise<void> {
  const data: AdminData = { passwordHash: hash };
  await fsp.mkdir(path.dirname(adminFile), { recursive: true });
  await fsp.writeFile(adminFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('admin.json', data).catch(() => {});
}
