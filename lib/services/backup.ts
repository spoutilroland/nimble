import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { getDataDir, getUploadsDir } from '@/lib/paths';

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
  FooterBlockSchema,
  MediaEntrySchema,
  CarouselEntrySchema,
  LayoutSchema,
  PageDataSchema,
  CustomThemeSchema,
  SectionTypeSchema,
  BlockTypeSchema,
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
 * Smart merge : comme deepMerge mais protège les objets peuplés contre l'écrasement par `{}`.
 * Si source est un objet vide et target a des clés → on garde target.
 */
function smartMerge(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) return target;
  if (target === null || target === undefined) return source;

  if (Array.isArray(source)) return source;

  if (typeof target === 'object' && typeof source === 'object' && !Array.isArray(target)) {
    const srcObj = source as Record<string, unknown>;
    const tgtObj = target as Record<string, unknown>;

    // Garde : si source est {} et target a des clés, on garde target
    if (Object.keys(srcObj).length === 0 && Object.keys(tgtObj).length > 0) {
      return target;
    }

    const result: Record<string, unknown> = { ...tgtObj };
    for (const [key, value] of Object.entries(srcObj)) {
      result[key] = smartMerge(result[key], value);
    }
    return result;
  }

  return source;
}

/**
 * Valide chaque entrée d'un z.record() individuellement.
 * Retourne les entrées valides et des warnings pour les invalides.
 */
function validateRecord<T>(
  data: unknown,
  entrySchema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: unknown } },
  filename: string,
  recordName: string,
): { valid: Record<string, T>; warnings: string[] } {
  const warnings: string[] = [];
  const valid: Record<string, T> = {};

  if (!data || typeof data !== 'object') return { valid, warnings };

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const result = entrySchema.safeParse(value);
    if (result.success) {
      valid[key] = result.data as T;
    } else {
      warnings.push(`${filename}: ${recordName}['${key}'] invalide — ignoré`);
    }
  }
  return { valid, warnings };
}

/**
 * Valide chaque élément d'un array individuellement.
 * Retourne les éléments valides et des warnings pour les invalides.
 */
function validateArray<T>(
  data: unknown,
  itemSchema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: unknown } },
  filename: string,
  arrayName: string,
): { valid: T[]; warnings: string[] } {
  const warnings: string[] = [];
  const valid: T[] = [];

  if (!Array.isArray(data)) return { valid, warnings };

  for (let i = 0; i < data.length; i++) {
    const result = itemSchema.safeParse(data[i]);
    if (result.success) {
      valid.push(result.data as T);
    } else {
      warnings.push(`${filename}: ${arrayName}[${i}] invalide — ignoré`);
    }
  }
  return { valid, warnings };
}

/**
 * Remplit les clés manquantes d'un objet depuis un objet de defaults.
 * Retourne le nombre de clés ajoutées.
 */
function fillMissingKeys(
  obj: Record<string, unknown>,
  defaults: Record<string, unknown>,
): number {
  let added = 0;
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in obj)) {
      obj[key] = value;
      added++;
    }
  }
  return added;
}

/** Defaults pour SocialLinksSchema (toutes les clés à '') */
const defaultSocial: Record<string, string> = {
  linkedin: '', facebook: '', instagram: '', x: '',
  tiktok: '', youtube: '', pinterest: '', github: '',
};

/** Defaults neutres pour ThemeVarsSchema */
const defaultThemeVars: Record<string, string> = {
  '--primary': '#333333', '--primary-dark': '#222222', '--primary-light': '#555555',
  '--secondary': '#666666', '--secondary-dark': '#444444',
  '--accent': '#0066cc', '--accent-dark': '#004499',
  '--bg': '#ffffff', '--bg-light': '#f5f5f5',
  '--text': '#333333', '--text-muted': '#888888',
};

/** Types de sections connus (extrait du SectionTypeSchema) */
const validSectionTypes: Set<string> = new Set(SectionTypeSchema.options);

/** Types de blocs connus (extrait du BlockTypeSchema) */
const validBlockTypes: Set<string> = new Set(BlockTypeSchema.options);

/**
 * Valide et complète un JSON importé avec migration intelligente par fichier.
 * Au lieu d'un safeParse global tout-ou-rien, chaque sous-structure est validée
 * individuellement : les parties valides sont gardées, les invalides sont droppées
 * avec un warning descriptif.
 */
function validateAndMerge(filename: string, data: unknown): { data: unknown; warnings: string[] } {
  const defaults = getDefaults();
  const defaultData = defaults[filename];
  const warnings: string[] = [];

  // Fusion intelligente avec les defaults
  const merged = smartMerge(defaultData, data) as Record<string, unknown>;

  switch (filename) {
    case 'site.json': {
      // social : remplir les clés manquantes
      if (merged.social && typeof merged.social === 'object') {
        const socialObj = merged.social as Record<string, unknown>;
        const added = fillMissingKeys(socialObj, defaultSocial);
        if (added > 0) {
          warnings.push(`site.json: ${added} champ(s) manquant(s) ajouté(s) dans social`);
        }
      }

      // footer.blocks : valider chaque bloc individuellement
      if (merged.footer && typeof merged.footer === 'object') {
        const footer = merged.footer as Record<string, unknown>;
        if (Array.isArray(footer.blocks)) {
          const { valid, warnings: blockWarnings } = validateArray(
            footer.blocks, FooterBlockSchema, 'site.json', 'footer.blocks',
          );
          footer.blocks = valid;
          warnings.push(...blockWarnings);
        }
      }

      // Validation globale — si ça passe, parfait. Sinon on garde le merged tel quel.
      const siteResult = SiteConfigSchema.safeParse(merged);
      if (siteResult.success) {
        return { data: siteResult.data, warnings };
      }
      warnings.push(`site.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'theme.json': {
      // customThemes : remplir les vars manquantes dans chaque thème
      if (merged.customThemes && typeof merged.customThemes === 'object') {
        const themes = merged.customThemes as Record<string, unknown>;
        const validThemes: Record<string, unknown> = {};

        for (const [key, theme] of Object.entries(themes)) {
          if (theme && typeof theme === 'object') {
            const t = theme as Record<string, unknown>;
            if (t.vars && typeof t.vars === 'object') {
              const varsObj = t.vars as Record<string, unknown>;
              const added = fillMissingKeys(varsObj, defaultThemeVars);
              if (added > 0) {
                warnings.push(`theme.json: thème '${key}' — ${added} variable(s) CSS manquante(s) remplie(s)`);
              }
            }
            const themeResult = CustomThemeSchema.safeParse(t);
            if (themeResult.success) {
              validThemes[key] = themeResult.data;
            } else {
              warnings.push(`theme.json: thème '${key}' invalide — ignoré`);
            }
          }
        }
        merged.customThemes = validThemes;
      }

      const themeResult = ThemeConfigSchema.safeParse(merged);
      if (themeResult.success) {
        return { data: themeResult.data, warnings };
      }
      warnings.push(`theme.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'layouts.json': {
      if (merged.layouts && typeof merged.layouts === 'object') {
        const layouts = merged.layouts as Record<string, unknown>;
        const validLayouts: Record<string, unknown> = {};

        for (const [key, layout] of Object.entries(layouts)) {
          if (layout && typeof layout === 'object') {
            const l = layout as Record<string, unknown>;
            // Filtrer les blocks avec un type inconnu
            if (Array.isArray(l.blocks)) {
              const originalBlocks = l.blocks as unknown[];
              const filteredBlocks = originalBlocks.filter((b: unknown) => {
                if (b && typeof b === 'object' && 'type' in b) {
                  return validBlockTypes.has((b as Record<string, unknown>).type as string);
                }
                return false;
              });
              const removed = originalBlocks.length - filteredBlocks.length;
              if (removed > 0) {
                warnings.push(`layouts.json: layout '${key}' — ${removed} bloc(s) avec type inconnu retiré(s)`);
              }
              l.blocks = filteredBlocks;
            }

            // Garder le layout s'il a au moins 1 bloc valide
            if (Array.isArray(l.blocks) && l.blocks.length > 0) {
              const layoutResult = LayoutSchema.safeParse(l);
              if (layoutResult.success) {
                validLayouts[key] = layoutResult.data;
              } else {
                warnings.push(`layouts.json: layout '${key}' invalide — ignoré`);
              }
            } else {
              warnings.push(`layouts.json: layout '${key}' sans bloc valide — ignoré`);
            }
          }
        }
        merged.layouts = validLayouts;
      }

      const layoutsResult = LayoutsConfigSchema.safeParse(merged);
      if (layoutsResult.success) {
        return { data: layoutsResult.data, warnings };
      }
      warnings.push(`layouts.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'media.json': {
      if (merged.media && typeof merged.media === 'object') {
        const { valid, warnings: mediaWarnings } = validateRecord(
          merged.media, MediaEntrySchema, 'media.json', 'media',
        );
        merged.media = valid;
        warnings.push(...mediaWarnings);
      }

      const mediaResult = MediaRegistrySchema.safeParse(merged);
      if (mediaResult.success) {
        return { data: mediaResult.data, warnings };
      }
      warnings.push(`media.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'carousels.json': {
      if (merged.carousels && typeof merged.carousels === 'object') {
        const { valid, warnings: carouselWarnings } = validateRecord(
          merged.carousels, CarouselEntrySchema, 'carousels.json', 'carousels',
        );
        merged.carousels = valid;
        warnings.push(...carouselWarnings);
      }

      const carouselsResult = CarouselsConfigSchema.safeParse(merged);
      if (carouselsResult.success) {
        return { data: carouselsResult.data, warnings };
      }
      warnings.push(`carousels.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'pages.json': {
      if (Array.isArray(merged.pages)) {
        const validPages: unknown[] = [];
        for (let i = 0; i < merged.pages.length; i++) {
          const page = merged.pages[i] as Record<string, unknown>;
          // Filtrer les sections avec un type inconnu
          if (Array.isArray(page?.sections)) {
            const originalSections = page.sections as unknown[];
            const filteredSections = originalSections.filter((s: unknown) => {
              if (s && typeof s === 'object' && 'type' in s) {
                return validSectionTypes.has((s as Record<string, unknown>).type as string);
              }
              return false;
            });
            const removed = originalSections.length - filteredSections.length;
            if (removed > 0) {
              warnings.push(`pages.json: page '${page.slug || i}' — ${removed} section(s) avec type inconnu retirée(s)`);
            }
            page.sections = filteredSections;
          }

          const pageResult = PageDataSchema.safeParse(page);
          if (pageResult.success) {
            validPages.push(pageResult.data);
          } else {
            warnings.push(`pages.json: page '${page?.slug || i}' invalide — ignorée`);
          }
        }
        merged.pages = validPages;
      }

      const pagesResult = PagesConfigSchema.safeParse(merged);
      if (pagesResult.success) {
        return { data: pagesResult.data, warnings };
      }
      warnings.push(`pages.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    case 'content.json': {
      const contentResult = ContentDataSchema.safeParse(merged);
      if (contentResult.success) {
        return { data: contentResult.data, warnings };
      }
      warnings.push(`content.json: validation globale échouée — données conservées telles quelles`);
      return { data: merged, warnings };
    }

    default:
      return { data: merged, warnings };
  }
}

/**
 * Construit un ZIP de backup contenant tous les JSON data/ et tous les uploads.
 * Les uploads sont dans {cwd}/uploads/ (pas public/uploads/).
 * Les fichiers absents localement sont récupérés depuis Vercel Blob.
 */
export async function buildBackupExport(): Promise<Buffer> {
  const dataDir = getDataDir();
  const uploadsDir = getUploadsDir();

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

  const uploadsDir = getUploadsDir();
  const dataDir = getDataDir();

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
      const { data: validated, warnings } = validateAndMerge(file, parsed);
      result.warnings.push(...warnings);

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

  // Nettoyage des références orphelines dans carousels
  try {
    const mediaRegistry = readMediaRegistry();
    const validMediaIds = new Set(Object.keys(mediaRegistry.media));
    const carouselsConfig = readCarouselsConfig();
    let orphansRemoved = 0;

    for (const [key, carousel] of Object.entries(carouselsConfig.carousels)) {
      if (Array.isArray(carousel.images)) {
        const before = carousel.images.length;
        carousel.images = carousel.images.filter((id: string) => validMediaIds.has(id));
        const removed = before - carousel.images.length;
        if (removed > 0) {
          orphansRemoved += removed;
          result.warnings.push(
            `carousels.json: carousel '${carousel.title || key}' — ${removed} référence(s) média orpheline(s) retirée(s)`,
          );
        }
      }
    }

    if (orphansRemoved > 0) {
      await writeCarouselsConfig(carouselsConfig);
    }
  } catch {
    // Pas critique — on continue sans nettoyage orphelins
  }

  // Traite les fichiers médias (uploads/)
  const mediaEntries = entries.filter(
    (e) => e.entryName.startsWith('uploads/') && !e.isDirectory
  );

  for (const entry of mediaEntries) {
    try {
      // uploads/media/foo.jpg → {uploadsDir}/media/foo.jpg
      const relativePath = entry.entryName; // uploads/dir/file
      const subPath = relativePath.startsWith('uploads/') ? relativePath.slice('uploads/'.length) : relativePath;
      const destPath = path.join(getUploadsDir(), subPath);
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
