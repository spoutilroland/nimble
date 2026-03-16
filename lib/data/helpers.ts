import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const uploadsDir = path.join(process.cwd(), 'uploads');

export function getLogoUrl(): string {
  try {
    const logoDir = path.join(uploadsDir, 'logo');
    const files = fs.readdirSync(logoDir).filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f));
    if (files.length > 0) return `/uploads/logo/${files[0]}`;
  } catch {
    // pas de dossier uploads/logo — on utilise le logo par défaut
  }
  return '/brand/logo.svg';
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

export function getSocialIconUrl(network: string): string | null {
  try {
    const dir = path.join(uploadsDir, 'social');
    const files = fs.readdirSync(dir).filter(
      (f) => f.startsWith(network + '.') && /\.(jpg|jpeg|png|webp)$/i.test(f)
    );
    return files.length > 0 ? `/uploads/social/${files[0]}` : null;
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

/** Génère un thumbnail 200px WebP pour l'admin (léger, rapide à charger) */
export async function generateThumb(filePath: string): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const thumbPath = path.join(dir, base + '-thumb.webp');
    await sharp(filePath)
      .resize({ width: 200, height: 200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(thumbPath);
    return true;
  } catch (err) {
    console.warn('Thumb generation skipped:', (err as Error).message);
    return false;
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

/**
 * Sanitise du HTML rich text : conserve les balises de formatage
 * mais supprime les scripts, event handlers et balises dangereuses.
 */
export function sanitizeRichText(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    // Supprimer les balises script/iframe/object/embed/form/input
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|select|button|link|meta|base)\b[^>]*>/gi, '')
    // Supprimer les event handlers (onclick, onerror, onload, etc.)
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Supprimer javascript: dans les href/src
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:/gi, '$1="')
    // Supprimer data: dans les src (sauf images)
    .replace(/src\s*=\s*["']?\s*data:(?!image\/)/gi, 'src="');
}

export function ensureUploadDirs(): void {
  for (const folder of ['media', 'logo', 'favicon', 'social']) {
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

export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
