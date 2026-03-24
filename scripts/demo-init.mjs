/**
 * Script d'initialisation des images demo.
 *
 * USAGE :
 *   1. Placer les images sources (jpg/png) dans uploads/media/demo-raw/
 *   2. Lancer : node scripts/demo-init.mjs
 *
 * Le script :
 *   - Redimensionne chaque image à max 1920px
 *   - Génère la version WebP
 *   - Génère le thumbnail (200px WebP)
 *   - Copie les fichiers traités dans uploads/media/
 *   - Met à jour data/media.json avec les entrées
 *   - Crée le snapshot demo dans data/demo-snapshot/
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, statSync, rmSync } from 'fs';
import { join, extname } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const RAW_DIR = join(ROOT, 'uploads', 'media', 'demo-raw');
const MEDIA_DIR = join(ROOT, 'uploads', 'media');
const DATA_DIR = join(ROOT, 'data');
const MEDIA_JSON = join(DATA_DIR, 'media.json');
const SNAPSHOT_DIR = join(DATA_DIR, 'demo-snapshot');
const SNAPSHOT_DATA = join(SNAPSHOT_DIR, 'data');
const SNAPSHOT_UPLOADS = join(SNAPSHOT_DIR, 'uploads');

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_MAP = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function generateId() {
  return 'm_' + Date.now() + '_' + Math.round(Math.random() * 1e9);
}

function copyDirRecursive(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function processImage(filePath, filename) {
  const ext = extname(filename).toLowerCase();
  const isRaster = ['.jpg', '.jpeg', '.png'].includes(ext);

  const buffer = readFileSync(filePath);
  let finalBuffer = buffer;

  // Redimensionner si > 1920px
  if (isRaster) {
    const meta = await sharp(buffer).metadata();
    if (meta.width && meta.height && (meta.width > 1920 || meta.height > 1920)) {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
  }

  // Écrire le fichier principal
  const outPath = join(MEDIA_DIR, filename);
  writeFileSync(outPath, finalBuffer);

  let hasWebp = false;
  let hasThumb = false;
  let width = 0;
  let height = 0;

  // Dimensions
  const meta = await sharp(finalBuffer).metadata();
  width = meta.width || 0;
  height = meta.height || 0;

  // WebP
  if (isRaster) {
    try {
      const webpName = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const webpBuffer = await sharp(finalBuffer).webp({ quality: 82 }).toBuffer();
      writeFileSync(join(MEDIA_DIR, webpName), webpBuffer);
      hasWebp = true;
    } catch { /* skip */ }
  }

  // Thumbnail (200px WebP)
  if (isRaster || ext === '.webp') {
    try {
      const thumbName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '-thumb.webp';
      const thumbBuffer = await sharp(finalBuffer)
        .resize({ width: 200, height: 200, fit: 'cover' })
        .webp({ quality: 70 })
        .toBuffer();
      writeFileSync(join(MEDIA_DIR, thumbName), thumbBuffer);
      hasThumb = true;
    } catch { /* skip */ }
  }

  return { hasWebp, hasThumb, width, height, fileSize: finalBuffer.length };
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.error(`[demo-init] Dossier introuvable : ${RAW_DIR}`);
    console.error(`[demo-init] Crée ce dossier et places-y les images sources (jpg/png).`);
    process.exit(1);
  }

  const files = readdirSync(RAW_DIR).filter(f => {
    const ext = extname(f).toLowerCase();
    return ALLOWED_EXT.includes(ext) && !f.startsWith('.');
  });

  if (files.length === 0) {
    console.error(`[demo-init] Aucune image trouvée dans ${RAW_DIR}`);
    process.exit(1);
  }

  console.log(`[demo-init] ${files.length} images à traiter...`);

  // Lire le media.json existant ou en créer un vide
  let mediaData = { media: {}, folders: {} };
  if (existsSync(MEDIA_JSON)) {
    mediaData = JSON.parse(readFileSync(MEDIA_JSON, 'utf-8'));
  }

  mkdirSync(MEDIA_DIR, { recursive: true });

  let processed = 0;
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const mime = MIME_MAP[ext] || 'image/jpeg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const outExt = ext === '.jpeg' ? '.jpg' : ext;
    const filename = uniqueSuffix + outExt;

    const srcPath = join(RAW_DIR, file);
    const result = await processImage(srcPath, filename);

    const id = generateId();
    mediaData.media[id] = {
      id,
      filename,
      originalName: file,
      mimeType: mime,
      hasWebp: result.hasWebp,
      hasThumb: result.hasThumb,
      uploadedAt: new Date().toISOString(),
      fileSize: result.fileSize,
      width: result.width,
      height: result.height,
    };

    processed++;
    if (processed % 10 === 0) console.log(`[demo-init] ${processed}/${files.length} traités...`);

    // Petit délai pour des IDs uniques
    await new Promise(r => setTimeout(r, 5));
  }

  // Écrire media.json
  writeFileSync(MEDIA_JSON, JSON.stringify(mediaData, null, 2));
  console.log(`[demo-init] media.json mis à jour (${Object.keys(mediaData.media).length} entrées)`);

  // Créer le snapshot demo
  console.log('[demo-init] Création du snapshot demo...');
  if (existsSync(SNAPSHOT_DIR)) {
    rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
  }
  mkdirSync(SNAPSHOT_DATA, { recursive: true });

  const DATA_FILES = ['carousels.json', 'content.json', 'layouts.json', 'media.json', 'pages.json', 'site.json', 'theme.json'];
  for (const f of DATA_FILES) {
    const src = join(DATA_DIR, f);
    if (existsSync(src)) {
      copyFileSync(src, join(SNAPSHOT_DATA, f));
    }
  }
  copyDirRecursive(join(ROOT, 'uploads'), SNAPSHOT_UPLOADS);

  console.log(`[demo-init] Snapshot créé dans ${SNAPSHOT_DIR}`);
  console.log(`[demo-init] Terminé ! ${processed} images traitées.`);
}

main().catch(err => {
  console.error('[demo-init] Erreur :', err);
  process.exit(1);
});
