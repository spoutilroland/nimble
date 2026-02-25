import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { AdminData } from '@/lib/types';

const adminFile = path.join(process.cwd(), 'data', 'admin.json');

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
  await fsp.writeFile(adminFile, JSON.stringify(data, null, 2));
}
