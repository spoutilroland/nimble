import { put, del, list } from '@vercel/blob';
import fsp from 'fs/promises';
import path from 'path';

// Map pathname → blob URL (peuplée au bootstrap, mise à jour sur put/delete)
const blobUrlMap = new Map<string, string>();

let bootstrapped = false;

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
 * Synchronise un fichier JSON local vers Vercel Blob (fire-and-forget).
 */
export async function syncJsonToBlob(filename: string, data: unknown): Promise<void> {
  if (!isBlobEnabled()) return;
  const pathname = `data/${filename}`;
  const blob = await put(pathname, JSON.stringify(data, null, 2), {
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
  if (!isBlobEnabled()) return '';
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
  if (!isBlobEnabled()) return;
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
  if (!isBlobEnabled()) return;
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

  console.log(`[storage] Bootstrap terminé : ${totalBlobs} blobs indexés, ${downloaded} fichiers restaurés`);
}
