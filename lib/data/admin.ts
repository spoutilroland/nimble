import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { AdminData } from '@/lib/types';
import { syncJsonToBlob } from '@/lib/storage';
import { getDataDir } from '@/lib/paths';

const adminFile = path.join(getDataDir(), 'admin.json');

export function readAdminHash(): string | null {
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
