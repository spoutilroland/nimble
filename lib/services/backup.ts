import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

import {
  readSiteConfig, writeSiteConfig,
  readPagesConfig, writePagesConfig,
  readMediaRegistry, writeMediaRegistry,
  readCarouselsConfig, writeCarouselsConfig,
  readLayoutsConfig, writeLayoutsConfig,
  readThemeFile, writeThemeFile,
  readContent, writeContent,
  getMediaUrls,
} from '@/lib/data';

import {
  SiteConfigSchema,
  PagesConfigSchema,
  MediaRegistrySchema,
  CarouselsConfigSchema,
  LayoutsConfigSchema,
  ThemeConfigSchema,
  ContentDataSchema,
} from '@/lib/schemas';

import { proxyBlobFile } from '@/lib/storage';

// Fichiers JSON à exporter/importer (pas admin.json ni setup.json — données sensibles)
const DATA_FILES = [
  'site.json',
  'pages.json',
  'media.json',
  'carousels.json',
  'layouts.json',
  'theme.json',
  'content.json',
] as const;

// Dossiers uploads à inclure dans le backup
const UPLOAD_DIRS = ['media', 'logo', 'favicon', 'social'] as const;

/**
 * Valeurs par défaut pour chaque fichier JSON.
 * Utilisées pour meubler les champs manquants lors d'un import d'une version antérieure.
 */
function getDefaults(): Record<string, unknown> {
  return {
    'site.json': readSiteConfig(),
    'pages.json': { pages: [] },
    'media.json': { media: {}, folders: {} },
    'carousels.json': { carousels: {} },
    'layouts.json': { layouts: {} },
    'theme.json': { theme: 'default', customThemes: {} },
    'content.json': {},
  };
}

/**
 * Deep merge : source est fusionné dans target.
 * Les valeurs de source priment. Les clés manquantes dans source sont complétées par target.
 */
function deepMerge(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) return target;
  if (target === null || target === undefined) return source;

  if (Array.isArray(source)) return source;

  if (typeof target === 'object' && typeof source === 'object' && !Array.isArray(target)) {
    const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      result[key] = deepMerge(result[key], value);
    }
    return result;
  }

  return source;
}

/**
 * Valide et complète un JSON importé avec les défauts pour les champs manquants.
 * Retourne les données nettoyées ou throw si irrécupérable.
 */
function validateAndMerge(filename: string, data: unknown): unknown {
  const defaults = getDefaults();
  const defaultData = defaults[filename];

  // Fusion des données importées avec les defaults
  const merged = deepMerge(defaultData, data);

  // Validation Zod (safeParse pour ne pas throw)
  const schemas: Record<string, { safeParse: (d: unknown) => { success: boolean; data?: unknown; error?: unknown } }> = {
    'site.json': SiteConfigSchema,
    'pages.json': PagesConfigSchema,
    'media.json': MediaRegistrySchema,
    'carousels.json': CarouselsConfigSchema,
    'layouts.json': LayoutsConfigSchema,
    'theme.json': ThemeConfigSchema,
    'content.json': ContentDataSchema,
  };

  const schema = schemas[filename];
  if (!schema) return merged;

  const result = schema.safeParse(merged);
  if (result.success) return result.data;

  // Si la validation échoue même après merge, on retourne les defaults
  console.warn(`[backup] Validation failed for ${filename}, using defaults. Errors:`, result.error);
  return defaultData;
}

/**
 * Construit un ZIP de backup contenant tous les JSON data/ et tous les uploads.
 * Les uploads sont dans {cwd}/uploads/ (pas public/uploads/).
 * Les fichiers absents localement sont récupérés depuis Vercel Blob.
 */
export async function buildBackupExport(): Promise<Buffer> {
  const dataDir = path.join(process.cwd(), 'data');
  const uploadsDir = path.join(process.cwd(), 'uploads');

  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve());
    archive.on('error', (err: Error) => reject(err));

    (async () => {
      try {
        // Ajoute chaque JSON dans data/
        for (const file of DATA_FILES) {
          const filePath = path.join(dataDir, file);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: `data/${file}` });
          }
        }

        // Ajoute les dossiers uploads locaux
        for (const dir of UPLOAD_DIRS) {
          const dirPath = path.join(uploadsDir, dir);
          if (fs.existsSync(dirPath)) {
            archive.directory(dirPath, `uploads/${dir}`);
          }
        }

        // Récupère les médias depuis Blob quand absents localement
        const registry = readMediaRegistry();
        const localMediaFiles = new Set<string>();
        const localMediaDir = path.join(uploadsDir, 'media');
        if (fs.existsSync(localMediaDir)) {
          for (const f of fs.readdirSync(localMediaDir)) {
            localMediaFiles.add(f);
          }
        }

        for (const entry of Object.values(registry.media)) {
          const urls = getMediaUrls(entry);
          // Fichiers associés à ce média : original, webp, thumb
          const filesToCheck = [
            urls.filename,
            ...(urls.webpUrl ? [path.basename(urls.webpUrl)] : []),
            ...(urls.thumbUrl ? [path.basename(urls.thumbUrl)] : []),
          ];

          for (const filename of filesToCheck) {
            if (localMediaFiles.has(filename)) continue; // déjà inclus via archive.directory

            // Récupère depuis Blob
            const blobPath = `uploads/media/${filename}`;
            const result = await proxyBlobFile(blobPath);
            if (result) {
              archive.append(result.buffer, { name: `uploads/media/${filename}` });
            }
          }
        }

        // Logo, favicon, social depuis Blob si absents localement
        for (const dir of ['logo', 'favicon', 'social'] as const) {
          const localDir = path.join(uploadsDir, dir);
          if (fs.existsSync(localDir) && fs.readdirSync(localDir).length > 0) continue;

          // Tente de récupérer les fichiers connus depuis Blob
          // On ne peut pas lister le Blob par préfixe ici, mais les fichiers
          // courants sont référencés dans site.json ou déduits
          // → on skip, ces dossiers sont rarement peuplés uniquement dans Blob
        }

        archive.finalize();
      } catch (err) {
        reject(err);
      }
    })();
  });

  return Buffer.concat(chunks);
}

export interface RestoreResult {
  jsonRestored: string[];
  mediaRestored: number;
  warnings: string[];
}

/**
 * Restaure un backup depuis un Buffer ZIP.
 * Valide chaque JSON avec les schemas Zod, complète les champs manquants avec les defaults.
 */
export async function restoreBackup(zipBuffer: Buffer): Promise<RestoreResult> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const result: RestoreResult = {
    jsonRestored: [],
    mediaRestored: 0,
    warnings: [],
  };

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const dataDir = path.join(process.cwd(), 'data');

  // Assure que les dossiers existent
  await fsp.mkdir(dataDir, { recursive: true });
  for (const dir of UPLOAD_DIRS) {
    await fsp.mkdir(path.join(uploadsDir, dir), { recursive: true });
  }

  // Traite les fichiers JSON (data/)
  for (const file of DATA_FILES) {
    const entry = entries.find((e) => e.entryName === `data/${file}`);
    if (!entry) {
      result.warnings.push(`${file} absent du ZIP — ignoré`);
      continue;
    }

    try {
      const raw = entry.getData().toString('utf8');
      const parsed = JSON.parse(raw);
      const validated = validateAndMerge(file, parsed);

      // Écrit via les fonctions existantes (qui gèrent aussi le sync Blob)
      switch (file) {
        case 'site.json':
          await writeSiteConfig(validated as Parameters<typeof writeSiteConfig>[0]);
          break;
        case 'pages.json':
          await writePagesConfig(validated as Parameters<typeof writePagesConfig>[0]);
          break;
        case 'media.json':
          await writeMediaRegistry(validated as Parameters<typeof writeMediaRegistry>[0]);
          break;
        case 'carousels.json':
          await writeCarouselsConfig(validated as Parameters<typeof writeCarouselsConfig>[0]);
          break;
        case 'layouts.json':
          await writeLayoutsConfig(validated as Parameters<typeof writeLayoutsConfig>[0]);
          break;
        case 'theme.json':
          await writeThemeFile(validated as Parameters<typeof writeThemeFile>[0]);
          break;
        case 'content.json':
          await writeContent(validated as Parameters<typeof writeContent>[0]);
          break;
      }

      result.jsonRestored.push(file);
    } catch (err) {
      result.warnings.push(`${file} : erreur de parsing — ${(err as Error).message}`);
    }
  }

  // Traite les fichiers médias (uploads/)
  const mediaEntries = entries.filter(
    (e) => e.entryName.startsWith('uploads/') && !e.isDirectory
  );

  for (const entry of mediaEntries) {
    try {
      // uploads/media/foo.jpg → {cwd}/uploads/media/foo.jpg
      const relativePath = entry.entryName; // uploads/dir/file
      const destPath = path.join(process.cwd(), relativePath);
      const destDir = path.dirname(destPath);
      await fsp.mkdir(destDir, { recursive: true });
      await fsp.writeFile(destPath, entry.getData());
      result.mediaRestored++;
    } catch (err) {
      result.warnings.push(`Média ${entry.entryName} : ${(err as Error).message}`);
    }
  }

  return result;
}
