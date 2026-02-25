import bcrypt from 'bcryptjs';
import { readAdminHash } from '@/lib/data/admin';

export async function verifyPassword(plain: string): Promise<boolean> {
  const hash = getActiveHash();
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

function getActiveHash(): string | null {
  // Priorité : data/admin.json > ADMIN_PASSWORD_HASH env > ADMIN_PASSWORD env (hashé)
  const fileHash = readAdminHash();
  if (fileHash) return fileHash;

  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;

  // Fallback : hash synchrone depuis ADMIN_PASSWORD (déconseillé en prod)
  if (process.env.ADMIN_PASSWORD) {
    return bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  }

  return null;
}
