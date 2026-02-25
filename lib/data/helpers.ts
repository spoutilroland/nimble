import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const uploadsDir = path.join(process.cwd(), 'uploads');

export function getLogoUrl(): string | null {
  try {
    const logoDir = path.join(uploadsDir, 'logo');
    const files = fs.readdirSync(logoDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    return files.length > 0 ? `/uploads/logo/${files[0]}` : null;
  } catch {
    return null;
  }
}

export function getFaviconUrl(): string | null {
  try {
    const dir = path.join(uploadsDir, 'favicon');
    const files = fs.readdirSync(dir).filter((f) => /\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f));
    return files.length > 0 ? `/uploads/favicon/${files[0]}` : null;
  } catch {
    return null;
  }
}

export async function processImageWithSharp(filePath: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const webpPath = path.join(dir, base + '.webp');
    await sharp(filePath)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(webpPath);
  } catch (err) {
    console.warn('Sharp processing skipped:', (err as Error).message);
  }
}

export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function ensureUploadDirs(): void {
  for (const folder of ['media', 'logo', 'favicon']) {
    const dir = path.join(uploadsDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/svg+xml': '.svg',
};

export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
