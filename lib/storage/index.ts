import { put, del, list } from '@vercel/blob';
import fsp from 'fs/promises';
import path from 'path';

// Map pathname → blob URL (peuplée au bootstrap, mise à jour sur put/delete)
const blobUrlMap = new Map<string, string>();

let bootstrapped = false;
let bootstrapDone = false;

export function isBlobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobToken(): string {
  return process.env.BLOB_READ_WRITE_TOKEN!;
}

/**
 * Fetch un blob privé avec le token d'authentification.
 */
async function fetchPrivateBlob(url: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${blobToken()}` },
  });
}

/**
 * Vérifie si un objet JSON parsé est "vide" (structure par défaut sans données utilisateur).
 */
function isEmptyJsonData(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== 'object') return true;
  const obj = parsed as Record<string, unknown>;
  // {} seul
  if (Object.keys(obj).length === 0) return true;
  // {"media": {}} {"carousels": {}} {"layouts": {}} {"customThemes": {}} etc.
  // {"pages": []} {"snapshots": []}
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0) return false;
    if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) return false;
    if (typeof val === 'string' && val.length > 0) return false;
    if (typeof val === 'number' || typeof val === 'boolean') return false;
  }
  return true;
}

/**
 * Synchronise un fichier JSON local vers Vercel Blob (fire-and-forget).
 */
export async function syncJsonToBlob(filename: string, data: unknown): Promise<void> {
  if (!isBlobEnabled()) return;
  // Bloquer toute écriture Blob tant que le bootstrap n'a pas restauré les données
  // Sinon les données par défaut du prebuild écrasent les vraies données
  if (!bootstrapDone) {
    console.warn(`[storage] syncJsonToBlob: bootstrap pas terminé, skip ${filename}`);
    return;
  }
  // Protection : ne jamais envoyer un JSON vide/par défaut au Blob
  if (isEmptyJsonData(data)) {
    console.warn(`[storage] syncJsonToBlob: données vides pour ${filename} — skip`);
    return;
  }
  const json = JSON.stringify(data, null, 2);
  const pathname = `data/${filename}`;
  const blob = await put(pathname, json, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  blobUrlMap.set(pathname, blob.url);
}

/**
 * Upload un fichier binaire vers Vercel Blob. Retourne l'URL du blob.
 */
export async function uploadToBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!isBlobEnabled() || !bootstrapDone) return '';
  const blob = await put(pathname, buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType,
  });
  blobUrlMap.set(pathname, blob.url);
  return blob.url;
}

/**
 * Supprime un fichier du Blob par pathname exact.
 */
export async function deleteFromBlob(pathname: string): Promise<void> {
  if (!isBlobEnabled() || !bootstrapDone) return;
  const url = blobUrlMap.get(pathname);
  if (url) {
    await del(url);
    blobUrlMap.delete(pathname);
  } else {
    const { blobs } = await list({ prefix: pathname, limit: 10 });
    const match = blobs.filter((b) => b.pathname === pathname);
    if (match.length > 0) {
      await del(match.map((b) => b.url));
      for (const b of match) blobUrlMap.delete(b.pathname);
    }
  }
}

/**
 * Supprime tous les blobs qui matchent un préfixe.
 */
export async function deleteFromBlobByPrefix(prefix: string): Promise<void> {
  if (!isBlobEnabled() || !bootstrapDone) return;
  const { blobs } = await list({ prefix, limit: 100 });
  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url));
    for (const b of blobs) blobUrlMap.delete(b.pathname);
  }
}

/**
 * Proxyfie un fichier blob privé vers le client (pour la route de serving uploads).
 * Retourne null si le pathname n'est pas dans le Blob.
 */
export async function proxyBlobFile(pathname: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!isBlobEnabled()) return null;

  let url = blobUrlMap.get(pathname);

  // Fallback : chercher dans le blob store si pas dans la map en mémoire
  if (!url) {
    try {
      const { blobs } = await list({ prefix: pathname, limit: 1 });
      const match = blobs.find((b) => b.pathname === pathname);
      if (match) {
        url = match.url;
        blobUrlMap.set(pathname, url);
      }
    } catch { /* ignore */ }
  }

  if (!url) return null;

  const res = await fetchPrivateBlob(url);
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return { buffer, contentType };
}

// ─── Opérations atomiques media.json sur Blob ───────────────────────────
// Le media.json sur Blob ne doit JAMAIS être remplacé en entier depuis Hostinger.
// Seules les opérations atomiques (append / remove) sont autorisées.

/**
 * Lit le media.json actuel depuis Vercel Blob (source de vérité).
 */
export async function readMediaFromBlob(): Promise<Record<string, unknown>> {
  if (!isBlobEnabled()) return {};

  const pathname = 'data/media.json';
  let url = blobUrlMap.get(pathname);

  if (!url) {
    try {
      const { blobs } = await list({ prefix: pathname, limit: 1 });
      const match = blobs.find((b) => b.pathname === pathname);
      if (match) {
        url = match.url;
        blobUrlMap.set(pathname, url);
      }
    } catch { /* ignore */ }
  }
  if (!url) return {};

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${blobToken()}` },
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data?.media && typeof data.media === 'object') ? data.media : {};
  } catch {
    return {};
  }
}

/**
 * Ajoute UNE entrée media au Blob (read-modify-write atomique).
 * Ne remplace jamais le fichier en entier — fusionne avec l'existant.
 */
export async function appendMediaToBlob(mediaId: string, entry: unknown): Promise<void> {
  if (!isBlobEnabled() || !bootstrapDone) return;
  try {
    const currentMedia = await readMediaFromBlob();
    currentMedia[mediaId] = entry;
    const json = JSON.stringify({ media: currentMedia }, null, 2);
    const pathname = 'data/media.json';
    const blob = await put(pathname, json, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    blobUrlMap.set(pathname, blob.url);
  } catch (err) {
    console.warn('[storage] appendMediaToBlob failed:', (err as Error).message);
  }
}

/**
 * Supprime UNE entrée media du Blob (read-modify-write atomique).
 */
export async function removeMediaFromBlob(mediaId: string): Promise<void> {
  if (!isBlobEnabled() || !bootstrapDone) return;
  try {
    const currentMedia = await readMediaFromBlob();
    delete currentMedia[mediaId];
    const json = JSON.stringify({ media: currentMedia }, null, 2);
    const pathname = 'data/media.json';
    const blob = await put(pathname, json, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    blobUrlMap.set(pathname, blob.url);
  } catch (err) {
    console.warn('[storage] removeMediaFromBlob failed:', (err as Error).message);
  }
}

/**
 * Bootstrap : télécharge toutes les données depuis Vercel Blob vers le filesystem local.
 * Appelé une seule fois au démarrage via instrumentation.ts.
 */
export async function bootstrapDataFromBlob(): Promise<void> {
  if (!isBlobEnabled() || bootstrapped) return;
  bootstrapped = true;

  console.log('[storage] Bootstrap depuis Vercel Blob...');
  let totalBlobs = 0;
  let downloaded = 0;

  let cursor: string | undefined;
  do {
    const result = await list({ cursor, limit: 1000 });
    for (const blob of result.blobs) {
      blobUrlMap.set(blob.pathname, blob.url);
      totalBlobs++;

      // Télécharger les fichiers JSON data + tous les uploads
      const shouldDownload =
        blob.pathname.startsWith('data/') ||
        blob.pathname.startsWith('uploads/');

      if (shouldDownload) {
        try {
          const localPath = path.join(process.cwd(), blob.pathname);

          const res = await fetchPrivateBlob(blob.url);
          const buffer = Buffer.from(await res.arrayBuffer());

          // Protection JSON : détection sémantique (pas de comparaison de strings)
          if (blob.pathname.endsWith('.json')) {
            let blobParsed: unknown;
            try {
              blobParsed = JSON.parse(buffer.toString('utf8'));
            } catch {
              console.warn(`[storage] Blob ${blob.pathname} JSON invalide — skip`);
              continue;
            }

            // Blob vide/par défaut → ne jamais écraser le local avec ça
            if (isEmptyJsonData(blobParsed)) {
              console.warn(`[storage] Blob ${blob.pathname} vide/par défaut — skip`);
              continue;
            }

            // Si le fichier local existe et contient des données valides → le garder.
            // Le local peut être plus récent si le sync Blob a échoué silencieusement.
            try {
              const localContent = await fsp.readFile(localPath, 'utf8');
              const localParsed = JSON.parse(localContent);
              if (!isEmptyJsonData(localParsed)) {
                // Local valide → pas d'écrasement
                continue;
              }
            } catch {
              // Fichier local absent ou illisible → restaurer depuis Blob
            }
          }

          await fsp.mkdir(path.dirname(localPath), { recursive: true });
          await fsp.writeFile(localPath, buffer);
          downloaded++;
        } catch (err) {
          console.warn(`[storage] Échec téléchargement ${blob.pathname}:`, (err as Error).message);
        }
      }
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  bootstrapDone = true;
  console.log(`[storage] Bootstrap terminé : ${totalBlobs} blobs indexés, ${downloaded} fichiers restaurés`);
}
