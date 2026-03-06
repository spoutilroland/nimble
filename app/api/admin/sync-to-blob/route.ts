export const runtime = 'nodejs';

/**
 * Route one-shot : envoie toutes les données locales existantes vers Vercel Blob.
 * À appeler une seule fois depuis le backoffice (ou via curl).
 *
 * POST /api/admin/sync-to-blob
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { useBlob, uploadToBlob } from '@/lib/storage';
import { put } from '@vercel/blob';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Fichiers JSON à synchroniser
const JSON_FILES = [
  'site.json', 'pages.json', 'theme.json', 'content.json',
  'media.json', 'carousels.json', 'layouts.json', 'admin.json',
  'setup.json', 'snapshots/snapshots.json',
];

// Dossiers d'uploads à synchroniser (tous les fichiers)
const UPLOAD_FOLDERS = ['logo', 'favicon', 'social', 'media'];

export const POST = withAuth(async () => {
  if (!useBlob()) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN non configuré' },
      { status: 400 }
    );
  }

  const results: { file: string; status: 'ok' | 'skipped' | 'error'; reason?: string }[] = [];

  // 1. Synchroniser les fichiers JSON data/
  for (const filename of JSON_FILES) {
    const localPath = path.join(DATA_DIR, filename);
    try {
      const content = await fsp.readFile(localPath, 'utf8');
      await put(`data/${filename}`, content, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });
      results.push({ file: `data/${filename}`, status: 'ok' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Fichier absent localement → on skip sans erreur
      if (msg.includes('ENOENT')) {
        results.push({ file: `data/${filename}`, status: 'skipped', reason: 'absent localement' });
      } else {
        results.push({ file: `data/${filename}`, status: 'error', reason: msg });
      }
    }
  }

  // 2. Synchroniser les snapshots individuels (data/snapshots/<uuid>/*.json)
  try {
    const snapshotsDir = path.join(DATA_DIR, 'snapshots');
    const entries = await fsp.readdir(snapshotsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const snapshotId = entry.name;
      const snapshotDir = path.join(snapshotsDir, snapshotId);
      const files = await fsp.readdir(snapshotDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const localPath = path.join(snapshotDir, file);
        try {
          const content = await fsp.readFile(localPath, 'utf8');
          await put(`data/snapshots/${snapshotId}/${file}`, content, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'application/json',
          });
          results.push({ file: `data/snapshots/${snapshotId}/${file}`, status: 'ok' });
        } catch (err: unknown) {
          results.push({
            file: `data/snapshots/${snapshotId}/${file}`,
            status: 'error',
            reason: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  } catch {
    // Pas de dossier snapshots → ok
  }

  // 3. Synchroniser les uploads (logo, favicon, social, media)
  for (const folder of UPLOAD_FOLDERS) {
    const folderPath = path.join(UPLOADS_DIR, folder);
    try {
      const files = await fsp.readdir(folderPath);
      for (const file of files) {
        if (!/\.(jpg|jpeg|png|webp|svg|ico|gif)$/i.test(file)) continue;
        const filePath = path.join(folderPath, file);
        try {
          const buffer = await fsp.readFile(filePath);
          await uploadToBlob(`uploads/${folder}/${file}`, buffer, guessMime(file));
          results.push({ file: `uploads/${folder}/${file}`, status: 'ok' });
        } catch (err: unknown) {
          results.push({
            file: `uploads/${folder}/${file}`,
            status: 'error',
            reason: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch {
      // Dossier absent → ok
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({
    success: errors === 0,
    summary: { ok, skipped, errors, total: results.length },
    results,
  });
});

function guessMime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.gif': 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}
